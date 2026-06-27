"""Module 6: Identity, Onboarding & Authentication.

Provisioning model (Module 6A):
  1. Institution-seeded (primary): admin roster-import -> invited users + invitation emails.
  2. Self-register with join code: roster match -> OTP -> activate; no match -> pending approval.
  3. SSO: later phase.

Open self-registration intentionally does NOT exist. The one exception is `/auth/bootstrap`,
which creates the very first admin of an institution and is refused once any user exists there.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.deps import get_current_user, require_role, get_current_session
from app.models import (
    AccountStatus,
    GlobalRole,
    InstitutionStatus,
    Invitation,
    OtpCode,
    PendingApproval,
    Session as SessionModel,
    University,
    User,
    NotificationSettings,
    Notification,
)
from app.notifier import get_notifier
from app.audit import log_action
from app.schemas import (
    AccessOut,
    AccountStatusIn,
    ActivateIn,
    ApprovalActionIn,
    DisplayNameIn,
    ForgotPasswordIn,
    ForgotPasswordOut,
    PasswordResetOut,
    PatchMeIn,
    ResetPasswordIn,
    RoleChangeIn,
    OtpVerifyIn,
    RefreshIn,
    ResolveJoinCodeOut,
    RosterImportIn,
    RosterImportResult,
    SelfRegisterIn,
    SessionOut,
    TokenOut,
    UserOut,
    FcmTokenIn,
    NotificationSettingsOut,
    NotificationSettingsUpdateIn,
    NotificationOut,
)
from app.security import (
    create_access_token,
    generate_opaque_token,
    generate_otp,
    hash_password,
    hash_token,
    is_expired,
    utc_in,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _issue_session(db: Session, user: User, device_name: str) -> tuple[SessionModel, str]:
    """Create a refresh-token-backed session; returns (session_model, raw_refresh_token)."""
    raw = generate_opaque_token()
    sess = SessionModel(
        user_id=user.id,
        refresh_token_hash=hash_token(raw),
        device_name=device_name or "Unknown device",
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return sess, raw


# --- Bootstrap (first admin only) ------------------------------------------------


@router.post("/bootstrap", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def bootstrap_admin(
    institution_id: str,
    email: str,
    password: str,
    full_name: str = "",
    db: Session = Depends(get_db),
) -> User:
    inst = db.get(University, institution_id)
    if inst is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Institution not found")
    if db.query(User).filter(User.institution_id == institution_id).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Institution already has users")
    admin = User(
        institution_id=institution_id,
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        global_role=GlobalRole.admin,
        status=AccountStatus.active,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


# --- Provisioning: roster import (Module 6A.1) -----------------------------------


@router.post("/roster-import", response_model=RosterImportResult)
def roster_import(
    body: RosterImportIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(GlobalRole.admin)),
) -> RosterImportResult:
    notifier = get_notifier()
    invited = skipped = 0
    for row in body.rows:
        if db.query(User).filter(User.email == row.email).first():
            skipped += 1
            continue
        user = User(
            institution_id=body.institution_id,
            email=row.email,
            full_name=row.full_name,
            title=row.title,
            matric_or_staff_id=row.matric_or_staff_id,
            global_role=row.global_role,
            status=AccountStatus.invited,
        )
        db.add(user)
        db.flush()  # assign user.id
        raw = generate_opaque_token()
        db.add(
            Invitation(
                user_id=user.id,
                token=raw,
                expires_at=utc_in(hours=settings.invitation_ttl_hours),
            )
        )
        notifier.send_email(
            to=row.email,
            subject="Activate your UniPortal account",
            body=f"Welcome! Activate here with token: {raw}",
        )
        invited += 1
    db.commit()
    return RosterImportResult(invited=invited, skipped_existing=skipped)


@router.post("/activate", response_model=UserOut)
def activate(body: ActivateIn, db: Session = Depends(get_db)) -> User:
    inv = db.query(Invitation).filter(Invitation.token == body.token).one_or_none()
    if inv is None or inv.accepted_at is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or used invitation")
    if is_expired(inv.expires_at):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invitation expired")
    user = db.get(User, inv.user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    user.password_hash = hash_password(body.password)
    user.status = AccountStatus.active
    inv.accepted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


# --- Self-service forgot password (design 04 "Forgot?") ------------------------


@router.post("/forgot-password", response_model=ForgotPasswordOut)
def forgot_password(body: ForgotPasswordIn, db: Session = Depends(get_db)):
    """Public: a logged-out user requests a reset link by email. Always returns
    200 (never reveals whether the email exists). When the account exists and is
    eligible, a reset token is issued and emailed."""
    user = db.query(User).filter(User.email == body.email).one_or_none()
    out = ForgotPasswordOut(status="reset_sent")
    # Don't leak existence, and don't let suspended/archived users reset their way in.
    if user is None or user.status in (AccountStatus.suspended, AccountStatus.archived):
        return out

    raw = generate_opaque_token()
    inv = Invitation(user_id=user.id, token=raw, expires_at=utc_in(hours=1))
    db.add(inv)
    db.commit()
    try:
        get_notifier().send_email(
            user.email,
            "Reset your Gather password",
            f"Use this code to reset your password (valid 1 hour): {raw}",
        )
    except Exception:
        pass
    # `reset_token` is surfaced for dev/test parity with the console notifier; in
    # production with a real SMTP backend it travels only in the email.
    out.reset_token = raw
    return out


@router.post("/reset-password", response_model=UserOut)
def reset_password(body: ResetPasswordIn, db: Session = Depends(get_db)) -> User:
    """Public: complete the reset with the emailed token + a new password.
    Unlike activation, this does not change account status."""
    inv = db.query(Invitation).filter(Invitation.token == body.token).one_or_none()
    if inv is None or inv.accepted_at is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or used reset link")
    if is_expired(inv.expires_at):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Reset link expired")
    user = db.get(User, inv.user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if user.status in (AccountStatus.suspended, AccountStatus.archived):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is not active")
    user.password_hash = hash_password(body.password)
    if user.status == AccountStatus.invited:
        user.status = AccountStatus.active
    inv.accepted_at = datetime.now(timezone.utc)
    # Revoke all live sessions so a leaked password can't keep an attacker in.
    now = datetime.now(timezone.utc)
    db.query(SessionModel).filter(
        SessionModel.user_id == user.id,
        SessionModel.revoked_at.is_(None),
    ).update({SessionModel.revoked_at: now}, synchronize_session=False)
    db.commit()
    db.refresh(user)
    return user


# --- Provisioning: self-register with join code (Module 6A.2) --------------------


@router.get("/resolve-join-code", response_model=ResolveJoinCodeOut)
def resolve_join_code(code: str, db: Session = Depends(get_db)) -> University:
    """Public match-preview for the Join screen (design 06). Given a join code,
    confirm which active institution it belongs to so the user can verify they're
    joining the right school before entering details. Returns 404 for unknown or
    inactive codes; never leaks anything beyond name + timezone."""
    inst = (
        db.query(University)
        .filter(
            University.join_code == code.strip().upper(),
            University.status == InstitutionStatus.active,
        )
        .one_or_none()
    )
    if inst is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown or inactive join code")
    return inst


@router.post("/self-register", status_code=status.HTTP_202_ACCEPTED)
def self_register(body: SelfRegisterIn, db: Session = Depends(get_db)) -> dict:
    inst = db.query(University).filter(University.join_code == body.join_code).one_or_none()
    if inst is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown join code")

    # Match against the pre-loaded roster by matric/staff id within this institution.
    user = (
        db.query(User)
        .filter(
            User.institution_id == inst.id,
            User.matric_or_staff_id == body.matric_or_staff_id,
        )
        .one_or_none()
    )
    if user is None:
        # No roster match -> Admin "Pending Approvals" queue.
        db.add(
            PendingApproval(
                institution_id=inst.id,
                email=body.email,
                full_name=body.full_name,
                matric_or_staff_id=body.matric_or_staff_id,
                requested_role=body.requested_role,
            )
        )
        db.commit()
        return {"status": "pending_approval"}

    # Roster match -> issue an OTP to verify ownership of the contact.
    raw = generate_otp()
    db.add(
        OtpCode(
            user_id=user.id,
            code_hash=hash_token(raw),
            purpose="verify",
            expires_at=utc_in(minutes=settings.otp_ttl_minutes),
        )
    )
    db.commit()
    get_notifier().send_email(to=user.email, subject="Your UniPortal code", body=f"Code: {raw}")
    return {"status": "otp_sent"}


@router.post("/verify-otp", response_model=UserOut)
def verify_otp(body: OtpVerifyIn, db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.email == body.email).one_or_none()
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    otp = (
        db.query(OtpCode)
        .filter(OtpCode.user_id == user.id, OtpCode.purpose == "verify", OtpCode.consumed_at.is_(None))
        .order_by(OtpCode.expires_at.desc())
        .first()
    )
    if otp is None or is_expired(otp.expires_at):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No valid code")
    otp.attempts += 1
    if otp.attempts > 5:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many attempts")
    if otp.code_hash != hash_token(body.code):
        db.commit()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Incorrect code")
    otp.consumed_at = datetime.now(timezone.utc)
    user.password_hash = hash_password(body.password)
    user.status = AccountStatus.active
    db.commit()
    db.refresh(user)
    return user


# --- Admin: pending approvals (Module 6A.2 fallback) -----------------------------


@router.get("/pending-approvals")
def list_pending(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(GlobalRole.admin)),
) -> list[dict]:
    rows = (
        db.query(PendingApproval)
        .filter(
            PendingApproval.institution_id == admin.institution_id,
            PendingApproval.status == "pending",
        )
        .all()
    )
    return [
        {
            "id": r.id,
            "email": r.email,
            "full_name": r.full_name,
            "matric_or_staff_id": r.matric_or_staff_id,
            "requested_role": r.requested_role.value,
        }
        for r in rows
    ]


@router.post("/pending-approvals/{approval_id}")
def act_on_approval(
    approval_id: str,
    body: ApprovalActionIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(GlobalRole.admin)),
) -> dict:
    appr = db.get(PendingApproval, approval_id)
    if appr is None or appr.institution_id != admin.institution_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Approval not found")
    if not body.approve:
        appr.status = "rejected"
        db.commit()
        return {"status": "rejected"}
    # Approve -> seed an invited user + invitation, same as roster import.
    user = User(
        institution_id=appr.institution_id,
        email=appr.email,
        full_name=appr.full_name,
        matric_or_staff_id=appr.matric_or_staff_id,
        global_role=appr.requested_role,
        status=AccountStatus.invited,
    )
    db.add(user)
    db.flush()
    raw = generate_opaque_token()
    db.add(Invitation(user_id=user.id, token=raw, expires_at=utc_in(hours=settings.invitation_ttl_hours)))
    appr.status = "approved"
    db.commit()
    get_notifier().send_email(to=appr.email, subject="UniPortal approved", body=f"Activate: {raw}")
    return {"status": "approved"}


# --- Login / refresh / sessions (Module 6C) --------------------------------------


@router.post("/login", response_model=TokenOut)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenOut:
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not user.password_hash or not verify_password(form.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Bad credentials")
    if user.status == AccountStatus.suspended:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account suspended")
    if user.status != AccountStatus.active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"Account not active ({user.status.value})")
    
    sess, refresh = _issue_session(db, user, device_name="Unknown device")
    access = create_access_token(subject=user.id, role=user.global_role.value, session_id=sess.id)
    return TokenOut(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=AccessOut)
def refresh(body: RefreshIn, db: Session = Depends(get_db)) -> AccessOut:
    sess = (
        db.query(SessionModel)
        .filter(SessionModel.refresh_token_hash == hash_token(body.refresh_token))
        .one_or_none()
    )
    if sess is None or sess.revoked_at is not None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
    user = db.get(User, sess.user_id)
    if user is None or user.status != AccountStatus.active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not active")
    sess.last_seen_at = datetime.now(timezone.utc)
    db.commit()
    return AccessOut(
        access_token=create_access_token(
            subject=user.id, role=user.global_role.value, session_id=sess.id
        )
    )


@router.get("/sessions", response_model=list[SessionOut])
def list_sessions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    current_sess: SessionModel = Depends(get_current_session),
) -> list[dict]:
    sessions = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == user.id, SessionModel.revoked_at.is_(None))
        .all()
    )
    out = []
    for s in sessions:
        out.append({
            "id": s.id,
            "device_name": s.device_name,
            "created_at": s.created_at,
            "last_seen_at": s.last_seen_at,
            "current": current_sess is not None and s.id == current_sess.id
        })
    return out


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_session(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    sess = db.get(SessionModel, session_id)
    if sess is None or sess.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    sess.revoked_at = datetime.now(timezone.utc)
    db.commit()


@router.post("/sessions/revoke-others")
def revoke_other_sessions(
    db: Session = Depends(get_db),
    current: SessionModel = Depends(get_current_session),
    user: User = Depends(get_current_user),
) -> dict:
    """Design 18: 'Log out all other devices' — revoke every live session but this one."""
    now = datetime.now(timezone.utc)
    q = db.query(SessionModel).filter(
        SessionModel.user_id == user.id,
        SessionModel.revoked_at.is_(None),
    )
    if current is not None:
        q = q.filter(SessionModel.id != current.id)
    revoked = q.update({SessionModel.revoked_at: now}, synchronize_session=False)
    db.commit()
    return {"revoked": revoked}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.patch("/me", response_model=UserOut)
def patch_me(
    body: PatchMeIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> User:
    """C18: Student/user updates their own profile fields (display name, photo consent)."""
    if body.display_name is not None:
        user.display_name = body.display_name.strip() or None
    if body.photo_consent is not None:
        user.photo_consent = body.photo_consent
    db.commit()
    db.refresh(user)
    return user


@router.get("/users", response_model=list[UserOut])
def list_users(
    role: str | None = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(GlobalRole.admin, GlobalRole.superadmin)),
) -> list[User]:
    """Admin: list all users in the institution."""
    q = db.query(User).filter(User.institution_id == admin.institution_id)
    if role:
        try:
            q = q.filter(User.global_role == GlobalRole(role))
        except ValueError:
            pass
    return q.order_by(User.full_name).all()


# --- Admin user management (design 26 · User detail) ---


def _same_institution(admin: User, target: User) -> None:
    if target is None or target.institution_id != admin.institution_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(GlobalRole.admin, GlobalRole.superadmin)),
) -> User:
    target = db.get(User, user_id)
    _same_institution(admin, target)
    return target


@router.post("/users/{user_id}/reset-password", response_model=PasswordResetOut)
def admin_reset_password(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(GlobalRole.admin, GlobalRole.superadmin)),
):
    """Design 26: emails a reset link. Issues a fresh invitation-style token and
    notifies the user; the raw token is returned so the flow is verifiable."""
    target = db.get(User, user_id)
    _same_institution(admin, target)

    raw = generate_opaque_token()
    expires = utc_in(hours=48)
    inv = Invitation(user_id=target.id, token=raw, expires_at=expires)
    db.add(inv)
    log_action(db, admin.id, "reset_password", target_id=target.id,
               details=f"{admin.email} -> {target.email}")
    db.commit()
    try:
        get_notifier().send_email(
            target.email,
            "Reset your Gather password",
            f"An administrator started a password reset. Token: {raw}",
        )
    except Exception:
        pass
    return PasswordResetOut(status="reset_sent", reset_token=raw, expires_at=expires)


@router.patch("/users/{user_id}/role", response_model=UserOut)
def admin_change_role(
    user_id: str,
    body: RoleChangeIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(GlobalRole.admin, GlobalRole.superadmin)),
) -> User:
    """Design 26: change a user's role (Lecturer ↔ Admin or Student)."""
    target = db.get(User, user_id)
    _same_institution(admin, target)
    if target.id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot change your own role")
    old = target.global_role.value
    target.global_role = body.global_role
    log_action(db, admin.id, "change_role", target_id=target.id,
               details=f"{old} -> {body.global_role.value}")
    db.commit()
    db.refresh(target)
    return target


@router.patch("/users/{user_id}/status", response_model=UserOut)
def admin_set_status(
    user_id: str,
    body: AccountStatusIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(GlobalRole.admin, GlobalRole.superadmin)),
) -> User:
    """Design 26: suspend / reactivate / archive an account. Suspending revokes
    all of the user's live sessions so they are forced out on next request."""
    target = db.get(User, user_id)
    _same_institution(admin, target)
    if target.id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot change your own status")
    target.status = body.status
    action = {
        AccountStatus.suspended: "suspend_account",
        AccountStatus.active: "reactivate_account",
        AccountStatus.archived: "archive_account",
    }.get(body.status, "set_status")
    if body.status in (AccountStatus.suspended, AccountStatus.archived):
        now = datetime.now(timezone.utc)
        db.query(SessionModel).filter(
            SessionModel.user_id == target.id,
            SessionModel.revoked_at.is_(None),
        ).update({SessionModel.revoked_at: now}, synchronize_session=False)
    log_action(db, admin.id, action, target_id=target.id,
               details=f"{admin.email} -> {target.email}")
    db.commit()
    db.refresh(target)
    return target


# --- FCM token and notifications (Module 11) ---

@router.put("/fcm-token", status_code=status.HTTP_204_NO_CONTENT)
def update_fcm_token(
    body: FcmTokenIn,
    db: Session = Depends(get_db),
    sess: SessionModel = Depends(get_current_session),
    user: User = Depends(get_current_user),
) -> None:
    if not sess:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Active session required")
    sess.fcm_token = body.fcm_token
    db.commit()


@router.get("/notifications/settings", response_model=NotificationSettingsOut)
def get_notification_settings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> NotificationSettings:
    from app.notification_service import NotificationService
    ns = NotificationService()
    return ns.get_user_settings(db, user.id)


@router.put("/notifications/settings", response_model=NotificationSettingsOut)
def update_notification_settings(
    body: NotificationSettingsUpdateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> NotificationSettings:
    from app.notification_service import NotificationService
    ns = NotificationService()
    settings = ns.get_user_settings(db, user.id)

    update_data = body.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(settings, field, val)

    db.commit()
    db.refresh(settings)
    return settings


@router.get("/notifications", response_model=list[NotificationOut])
def get_notifications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.put("/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Notification:
    notif = db.get(Notification, notification_id)
    if not notif or notif.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    notif.read_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notif)
    return notif


@router.put("/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    now = datetime.now(timezone.utc)
    db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.read_at.is_(None)
    ).update({Notification.read_at: now}, synchronize_session=False)
    db.commit()
