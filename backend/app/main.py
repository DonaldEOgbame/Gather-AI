from fastapi import FastAPI

from app.routers import auth, courses, materials, audit_logs, enrollment, timetable, backup, announcements, reports, sessions, offerings

app = FastAPI(title="Gather-AI (UniPortal) API", version="0.1.0")

app.include_router(auth.router)
app.include_router(audit_logs.router)
app.include_router(courses.router)
app.include_router(materials.router)
app.include_router(enrollment.router)
app.include_router(enrollment.join_code_router)
app.include_router(timetable.router)
app.include_router(backup.router)
app.include_router(announcements.router)
app.include_router(reports.router)
app.include_router(sessions.router)
app.include_router(offerings.router)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


@app.get("/launch")
def launch():
    from fastapi.responses import HTMLResponse
    html_content = """
    <html>
        <head>
            <title>Launch UniPortal</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background-color: #f5f5f7;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 20px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                    max-width: 400px;
                    width: 100%;
                    text-align: center;
                }
                h1 {
                    font-size: 24px;
                    margin-bottom: 20px;
                    color: #1d1d1f;
                }
                p {
                    font-size: 14px;
                    color: #86868b;
                    margin-bottom: 30px;
                    line-height: 1.4;
                }
                .btn {
                    display: block;
                    padding: 16px 24px;
                    font-size: 16px;
                    font-weight: 600;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    text-decoration: none;
                    transition: transform 0.1s ease, background-color 0.2s;
                    margin-bottom: 15px;
                }
                .btn-local {
                    background-color: #34c759;
                    box-shadow: 0 4px 6px rgba(52, 199, 89, 0.25);
                }
                .btn-local:active {
                    transform: scale(0.98);
                }
                .btn-tunnel {
                    background-color: #007aff;
                    box-shadow: 0 4px 6px rgba(0, 122, 255, 0.25);
                }
                .btn-tunnel:active {
                    transform: scale(0.98);
                }
                .warning {
                    font-size: 12px;
                    color: #ff9500;
                    text-align: left;
                    margin-top: 20px;
                    border-top: 1px solid #e5e5ea;
                    padding-top: 15px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Launch UniPortal</h1>
                <p>Select your connection type to open the app in Expo Go:</p>
                
                <a class="btn btn-local" href="exp://172.20.10.3:8081">Option 1: Local Wi-Fi (Fastest)</a>
                
                <a class="btn btn-tunnel" href="exp://public-clouds-move.loca.lt">Option 2: Tunnel (Cellular/Remote)</a>
                
                <div class="warning">
                    <strong>Note for Option 2:</strong> If you use the Tunnel option, you must visit the <a href="https://public-clouds-move.loca.lt" target="_blank">Metro Tunnel link</a> first and click the bypass button before launching, or Expo will timeout.
                </div>
            </div>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)
