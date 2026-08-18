"""
Student Result Portal – config.py
Loads configuration from environment variables.
Never hard-code credentials here.
"""

import os
from dotenv import load_dotenv

# Load .env file when running locally
load_dotenv()


class Config:
    # Flask
    SECRET_KEY: str = os.environ.get("RESULT_SECRET_KEY", "change-me-in-production")
    DEBUG: bool = os.environ.get("RESULT_DEBUG", "false").lower() == "true"

    # MySQL – loaded from environment variables only
    DB_HOST: str = os.environ.get("DB_HOST", "localhost")
    DB_PORT: int = int(os.environ.get("DB_PORT", "3306"))
    DB_USER: str = os.environ.get("DB_USER", "root")
    DB_PASSWORD: str = os.environ.get("DB_PASSWORD", "")
    DB_NAME: str = os.environ.get("DB_NAME", "aws_event_platform")

    # CORS – allow frontend origin
    CORS_ORIGINS: list = os.environ.get(
        "RESULT_CORS_ORIGINS", "http://localhost:8082,http://127.0.0.1:8082"
    ).split(",")

    # Port for local development
    PORT: int = int(os.environ.get("RESULT_PORT", "5002"))
