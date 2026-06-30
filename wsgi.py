"""
WSGI entrypoint for production deployment (Render, Railway, etc.)
Run with: gunicorn wsgi:app
"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run()
