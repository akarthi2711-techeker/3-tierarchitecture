"""
Student Result Portal – app.py
Flask application entry point.
Runs independently on port 5002.
"""

from flask import Flask
from flask_cors import CORS
from config import Config
from routes.auth import auth_bp
from routes.results import results_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS – restrict to configured frontend origins
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=False)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(results_bp)

    # Root ping
    @app.route("/", methods=["GET"])
    def index():
        return {"service": "Student Result API", "status": "running"}, 200

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(
        host="0.0.0.0",
        port=Config.PORT,
        debug=Config.DEBUG,
    )
