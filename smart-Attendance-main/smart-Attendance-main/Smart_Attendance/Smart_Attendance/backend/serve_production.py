"""
Production entry point for the Smart-Attendance app.

Runs the Flask app under waitress (a production WSGI server) instead of
the Flask development server. Usage:

    python serve_production.py            # port 5050, 8 threads
    PORT=8080 THREADS=16 python serve_production.py
"""

import os
from waitress import serve

from app import app

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "5050"))
    threads = int(os.environ.get("THREADS", "8"))
    print(f"Smart-Attendance (production) on {host}:{port} threads={threads}")
    serve(app, host=host, port=port, threads=threads)
