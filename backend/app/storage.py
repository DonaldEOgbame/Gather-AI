"""Storage adapter. Local-disk by default; S3/R2 (boto3) via `storage_backend=s3`
and Cloudinary via `storage_backend=cloudinary`, all behind the same Protocol."""

import io
from pathlib import Path
from typing import BinaryIO, Protocol

from app.config import get_settings

settings = get_settings()


class StorageAdapter(Protocol):
    def put(self, key: str, data: bytes) -> None: ...
    def open(self, key: str) -> BinaryIO: ...
    def exists(self, key: str) -> bool: ...


class LocalStorage:
    def __init__(self, root: str) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        return self.root / key

    def put(self, key: str, data: bytes) -> None:
        p = self._path(key)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)

    def open(self, key: str) -> BinaryIO:
        return open(self._path(key), "rb")

    def exists(self, key: str) -> bool:
        return self._path(key).exists()


class S3Storage:
    """Real object storage on S3 / Cloudflare R2 / any S3-compatible endpoint.

    Activated with `storage_backend=s3` plus `s3_bucket` and credentials. Objects
    are stored under their content key; downloads stream from a BytesIO so the
    rest of the app keeps the same `open()` -> file-like contract as local disk.
    """

    def __init__(self) -> None:
        import boto3  # imported lazily so local-only installs don't need it

        if not settings.s3_bucket:
            raise RuntimeError("storage_backend=s3 requires s3_bucket to be set")
        self.bucket = settings.s3_bucket
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url or None,
            region_name=settings.s3_region or None,
            aws_access_key_id=settings.s3_access_key or None,
            aws_secret_access_key=settings.s3_secret_key or None,
        )

    def put(self, key: str, data: bytes) -> None:
        self.client.put_object(Bucket=self.bucket, Key=key, Body=data)

    def open(self, key: str) -> BinaryIO:
        obj = self.client.get_object(Bucket=self.bucket, Key=key)
        return io.BytesIO(obj["Body"].read())

    def exists(self, key: str) -> bool:
        from botocore.exceptions import ClientError

        try:
            self.client.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as e:
            if e.response.get("Error", {}).get("Code") in ("404", "NoSuchKey", "NotFound"):
                return False
            raise


class CloudinaryStorage:
    """Real object storage on Cloudinary (storage_backend=cloudinary).

    Every object is uploaded as `resource_type=raw` with the content key as its
    public_id, so arbitrary course materials (PDF/slides/images) round-trip byte
    for byte and keep the same `put`/`open`/`exists` contract as local disk.
    """

    def __init__(self) -> None:
        import cloudinary  # imported lazily so non-Cloudinary installs don't need it
        import cloudinary.api
        import cloudinary.uploader

        if not settings.cloudinary_cloud_name:
            raise RuntimeError("storage_backend=cloudinary requires cloudinary_cloud_name to be set")
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )
        self._uploader = cloudinary.uploader
        self._api = cloudinary.api

    def put(self, key: str, data: bytes) -> None:
        self._uploader.upload(
            io.BytesIO(data),
            public_id=key,
            resource_type="raw",
            overwrite=True,
            invalidate=True,
            use_filename=False,
            unique_filename=False,
        )

    def open(self, key: str) -> BinaryIO:
        import urllib.request

        info = self._api.resource(key, resource_type="raw")
        with urllib.request.urlopen(info["secure_url"]) as resp:
            return io.BytesIO(resp.read())

    def exists(self, key: str) -> bool:
        import cloudinary.exceptions

        try:
            self._api.resource(key, resource_type="raw")
            return True
        except cloudinary.exceptions.NotFound:
            return False


def get_storage() -> StorageAdapter:
    backend = settings.storage_backend
    if backend == "local":
        return LocalStorage(settings.local_storage_dir)
    if backend == "s3":
        return S3Storage()
    if backend == "cloudinary":
        return CloudinaryStorage()
    raise NotImplementedError(
        f"Unknown storage backend '{backend}' (use 'local', 's3', or 'cloudinary')."
    )
