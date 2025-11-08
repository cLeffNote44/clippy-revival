"""
Configuration Management
Centralized configuration for the Clippy Revival backend
"""

import os
from pathlib import Path
from typing import Optional


class Config:
    """Application configuration"""

    # Application
    APP_NAME = "Clippy Revival"
    APP_VERSION = "1.0.0"
    APP_DESCRIPTION = "AI-powered desktop assistant backend API"

    # Server
    HOST = "127.0.0.1"  # Localhost only for security
    PORT = int(os.environ.get("PORT", 43110))
    RELOAD = os.environ.get("NODE_ENV") == "development"

    # Paths
    BASE_DIR = Path(__file__).parent
    PROJECT_ROOT = BASE_DIR.parent
    CHARACTERS_DIR = PROJECT_ROOT / "characters"
    LOGS_DIR = BASE_DIR / "logs"

    # WebSocket
    WS_RECONNECT_DELAY = 5000  # milliseconds
    WS_MAX_RETRIES = 10
    WS_PING_INTERVAL = 30  # seconds

    # System Monitoring
    METRICS_INTERVAL = 2  # seconds
    METRICS_HISTORY_SIZE = 100  # number of data points to keep

    # Backend Health Check
    HEALTH_CHECK_MAX_ATTEMPTS = 30
    HEALTH_CHECK_INTERVAL = 1  # seconds

    # Ollama
    OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_DEFAULT_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")
    OLLAMA_REQUEST_TIMEOUT = 60  # seconds

    # File Operations
    FILE_UPLOAD_MAX_SIZE = 100 * 1024 * 1024  # 100MB
    FILE_CHUNK_SIZE = 8192  # bytes

    # Logging
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
    LOG_MAX_BYTES = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT = 5
    LOG_FORMAT_JSON = os.environ.get("LOG_FORMAT") == "json"

    # Security
    ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    CORS_MAX_AGE = 3600  # seconds

    # Scheduler
    SCHEDULER_CHECK_INTERVAL = 60  # seconds
    SCHEDULER_MAX_HISTORY = 1000  # tasks

    # Session
    SESSION_MAX_MESSAGES = 100  # Maximum messages per chat session
    SESSION_CLEANUP_INTERVAL = 3600  # seconds (1 hour)

    @classmethod
    def get(cls, key: str, default: Optional[any] = None):
        """Get configuration value"""
        return getattr(cls, key, default)

    @classmethod
    def set(cls, key: str, value: any):
        """Set configuration value"""
        setattr(cls, key, value)


# Create singleton instance
config = Config()
