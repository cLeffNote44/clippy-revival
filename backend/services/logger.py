"""
Structured Logging Service
Provides centralized logging configuration with rotation and formatting
"""

import logging
import logging.handlers
import sys
from pathlib import Path
from datetime import datetime
import json


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""

    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id

        if hasattr(record, "session_id"):
            log_data["session_id"] = record.session_id

        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        return json.dumps(log_data)


class ColoredFormatter(logging.Formatter):
    """Colored formatter for console output"""

    COLORS = {
        'DEBUG': '\033[36m',  # Cyan
        'INFO': '\033[32m',   # Green
        'WARNING': '\033[33m', # Yellow
        'ERROR': '\033[31m',  # Red
        'CRITICAL': '\033[35m' # Magenta
    }
    RESET = '\033[0m'

    def format(self, record):
        log_color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{log_color}{record.levelname}{self.RESET}"
        return super().format(record)


def setup_logging(
    name: str = "clippy",
    level: str = "INFO",
    log_dir: str = "logs",
    enable_console: bool = True,
    enable_file: bool = True,
    enable_json: bool = False,
    max_bytes: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5
) -> logging.Logger:
    """
    Setup structured logging with rotation

    Args:
        name: Logger name
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory for log files
        enable_console: Enable console logging
        enable_file: Enable file logging
        enable_json: Use JSON format for file logs
        max_bytes: Maximum size of log file before rotation
        backup_count: Number of backup files to keep

    Returns:
        Configured logger instance
    """

    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    logger.handlers.clear()

    # Create logs directory
    if enable_file:
        log_path = Path(__file__).parent.parent / log_dir
        log_path.mkdir(exist_ok=True)

    # Console handler
    if enable_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)

        console_formatter = ColoredFormatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

    # File handler with rotation
    if enable_file:
        if enable_json:
            log_file = log_path / f"{name}.json"
            file_handler = logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=max_bytes,
                backupCount=backup_count
            )
            file_handler.setFormatter(JSONFormatter())
        else:
            log_file = log_path / f"{name}.log"
            file_handler = logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=max_bytes,
                backupCount=backup_count
            )
            file_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(module)s:%(funcName)s:%(lineno)d - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            file_handler.setFormatter(file_formatter)

        file_handler.setLevel(logging.DEBUG)
        logger.addHandler(file_handler)

    # Error file handler (separate file for errors)
    if enable_file:
        error_log_file = log_path / f"{name}_errors.log"
        error_handler = logging.handlers.RotatingFileHandler(
            error_log_file,
            maxBytes=max_bytes,
            backupCount=backup_count
        )
        error_handler.setLevel(logging.ERROR)
        error_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(module)s:%(funcName)s:%(lineno)d\n'
            '%(message)s\n'
            '%(exc_info)s\n',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        error_handler.setFormatter(error_formatter)
        logger.addHandler(error_handler)

    return logger


def get_logger(name: str = None) -> logging.Logger:
    """
    Get a logger instance

    Args:
        name: Logger name (defaults to clippy if not specified)

    Returns:
        Logger instance
    """
    if name:
        return logging.getLogger(f"clippy.{name}")
    return logging.getLogger("clippy")


# Initialize default logger
default_logger = setup_logging(
    name="clippy",
    level="INFO",
    enable_console=True,
    enable_file=True,
    enable_json=False
)


# Convenience functions
def debug(msg, *args, **kwargs):
    """Log debug message"""
    default_logger.debug(msg, *args, **kwargs)


def info(msg, *args, **kwargs):
    """Log info message"""
    default_logger.info(msg, *args, **kwargs)


def warning(msg, *args, **kwargs):
    """Log warning message"""
    default_logger.warning(msg, *args, **kwargs)


def error(msg, *args, **kwargs):
    """Log error message"""
    default_logger.error(msg, *args, **kwargs)


def critical(msg, *args, **kwargs):
    """Log critical message"""
    default_logger.critical(msg, *args, **kwargs)


def exception(msg, *args, **kwargs):
    """Log exception with traceback"""
    default_logger.exception(msg, *args, **kwargs)
