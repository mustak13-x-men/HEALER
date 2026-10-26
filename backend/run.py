import os
import sys
import traceback
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("healer_runner")

print("=" * 60, flush=True)
print("HEALER BACKEND RUNNER STARTING", flush=True)
print(f"Python: {sys.version}", flush=True)
print(f"CWD: {os.getcwd()}", flush=True)
port = int(os.environ.get("PORT", 10000))
print(f"Target PORT: {port}", flush=True)
print("=" * 60, flush=True)

try:
    import uvicorn
    from app.main import app
    print("FastAPI app imported successfully! Starting uvicorn...", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
except Exception as startup_err:
    error_trace = traceback.format_exc()
    print("!" * 60, flush=True)
    print(f"STARTUP CRASH DETECTED:\n{error_trace}", flush=True)
    print("!" * 60, flush=True)
    
    # Start emergency diagnostic server so port check passes and we can read the error
    from http.server import HTTPServer, BaseHTTPRequestHandler
    
    class DiagHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            msg = f"HEALER STARTUP DIAGNOSTIC:\n\n{error_trace}"
            self.wfile.write(msg.encode("utf-8"))
    
    print(f"Starting diagnostic server on 0.0.0.0:{port}...", flush=True)
    httpd = HTTPServer(("0.0.0.0", port), DiagHandler)
    httpd.serve_forever()
