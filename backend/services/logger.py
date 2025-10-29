"""
Structured logging service for the backend application.
Provides consistent logging across all backend services.
"""

import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from datetime import datetime
import json


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""

    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields
        if hasattr(record, "extra"):
            log_data.update(record.extra)

        return json.dumps(log_data)


class Logger:
    """Centralized logger for the application"""

    _instance = None
    _logger = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Logger, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Initialize the logger with handlers"""
        self._logger = logging.getLogger("clippy_backend")
        self._logger.setLevel(logging.DEBUG)

        # Remove existing handlers
        self._logger.handlers.clear()

        # Create logs directory
        log_dir = Path(__file__).parent.parent / "logs"
        log_dir.mkdir(exist_ok=True)

        # Console handler (human-readable)
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        console_handler.setFormatter(console_formatter)

        # File handler (JSON format)
        file_handler = RotatingFileHandler(
            log_dir / "clippy-backend.log",
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(JSONFormatter())

        # Error file handler (JSON format)
        error_handler = RotatingFileHandler(
            log_dir / "clippy-backend-errors.log",
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(JSONFormatter())

        # Add handlers
        self._logger.addHandler(console_handler)
        self._logger.addHandler(file_handler)
        self._logger.addHandler(error_handler)

    def debug(self, message, **kwargs):
        """Log debug message"""
        self._logger.debug(message, extra=kwargs)

    def info(self, message, **kwargs):
        """Log info message"""
        self._logger.info(message, extra=kwargs)

    def warning(self, message, **kwargs):
        """Log warning message"""
        self._logger.warning(message, extra=kwargs)

    def error(self, message, **kwargs):
        """Log error message"""
        self._logger.error(message, extra=kwargs)

    def critical(self, message, **kwargs):
        """Log critical message"""
        self._logger.critical(message, extra=kwargs)

    def exception(self, message, **kwargs):
        """Log exception with traceback"""
        self._logger.exception(message, extra=kwargs)

    def get_logger(self):
        """Get the underlying logger instance"""
        return self._logger


# Global logger instance
logger = Logger()


# Convenience functions
def debug(message, **kwargs):
    """Log debug message"""
    logger.debug(message, **kwargs)


def info(message, **kwargs):
    """Log info message"""
    logger.info(message, **kwargs)


def warning(message, **kwargs):
    """Log warning message"""
    logger.warning(message, **kwargs)


def error(message, **kwargs):
    """Log error message"""
    logger.error(message, **kwargs)


def critical(message, **kwargs):
    """Log critical message"""
    logger.critical(message, **kwargs)


def exception(message, **kwargs):
    """Log exception with traceback"""
    logger.exception(message, **kwargs)


# Example usage
if __name__ == "__main__":
    info("Backend starting up", component="main")
    debug("Debug information", user_id=123)
    warning("This is a warning", action="test")
    error("This is an error", error_code="TEST_001")

    try:
        raise ValueError("Test exception")
    except Exception:
        exception("An exception occurred", context="test")
