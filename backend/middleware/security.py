"""
Security middleware for FastAPI application
Provides security headers and rate limiting
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
from collections import defaultdict
from typing import Dict, Tuple
import asyncio


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all HTTP responses
    """

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )

        # Remove Server header to not expose server info
        if "Server" in response.headers:
            del response.headers["Server"]

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to implement rate limiting per IP address
    """

    def __init__(
        self,
        app,
        requests_per_minute: int = 60,
        burst_size: int = 10
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.burst_size = burst_size
        self.request_counts: Dict[str, list] = defaultdict(list)
        self.lock = asyncio.Lock()

        # Start cleanup task
        asyncio.create_task(self._cleanup_old_requests())

    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = self._get_client_ip(request)

        # Check rate limit
        if not await self._check_rate_limit(client_ip):
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later.",
                headers={"Retry-After": "60"}
            )

        response = await call_next(request)

        # Add rate limit headers
        remaining = await self._get_remaining_requests(client_ip)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + 60)

        return response

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request"""
        # Check X-Forwarded-For header first (for proxies)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        # Fall back to client host
        if request.client:
            return request.client.host

        return "unknown"

    async def _check_rate_limit(self, client_ip: str) -> bool:
        """Check if client is within rate limits"""
        async with self.lock:
            now = time.time()
            minute_ago = now - 60

            # Get requests in last minute
            requests = self.request_counts[client_ip]
            recent_requests = [
                req_time for req_time in requests
                if req_time > minute_ago
            ]

            # Check burst limit (requests in last second)
            second_ago = now - 1
            burst_requests = [
                req_time for req_time in recent_requests
                if req_time > second_ago
            ]

            if len(burst_requests) >= self.burst_size:
                return False

            # Check minute limit
            if len(recent_requests) >= self.requests_per_minute:
                return False

            # Add current request
            recent_requests.append(now)
            self.request_counts[client_ip] = recent_requests

            return True

    async def _get_remaining_requests(self, client_ip: str) -> int:
        """Get remaining requests for client"""
        async with self.lock:
            now = time.time()
            minute_ago = now - 60

            requests = self.request_counts.get(client_ip, [])
            recent_requests = [
                req_time for req_time in requests
                if req_time > minute_ago
            ]

            return max(0, self.requests_per_minute - len(recent_requests))

    async def _cleanup_old_requests(self):
        """Periodically clean up old request records"""
        while True:
            await asyncio.sleep(300)  # Run every 5 minutes

            async with self.lock:
                now = time.time()
                minute_ago = now - 60

                # Clean up old requests
                for client_ip in list(self.request_counts.keys()):
                    requests = self.request_counts[client_ip]
                    recent_requests = [
                        req_time for req_time in requests
                        if req_time > minute_ago
                    ]

                    if recent_requests:
                        self.request_counts[client_ip] = recent_requests
                    else:
                        # Remove client if no recent requests
                        del self.request_counts[client_ip]


class InputValidationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to validate and sanitize request inputs
    """

    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB

    async def dispatch(self, request: Request, call_next):
        # Check content length
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_CONTENT_LENGTH:
            raise HTTPException(
                status_code=413,
                detail="Request body too large"
            )

        # Validate Content-Type for POST/PUT requests
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")

            # Only allow specific content types
            allowed_types = [
                "application/json",
                "application/x-www-form-urlencoded",
                "multipart/form-data"
            ]

            if not any(ct in content_type for ct in allowed_types):
                raise HTTPException(
                    status_code=415,
                    detail="Unsupported Media Type"
                )

        response = await call_next(request)
        return response


def sanitize_string(value: str, max_length: int = 1000) -> str:
    """
    Sanitize string input to prevent injection attacks
    """
    if not isinstance(value, str):
        return str(value)

    # Remove null bytes
    value = value.replace('\x00', '')

    # Remove or replace control characters
    sanitized = ''.join(
        char if char.isprintable() or char in '\n\r\t' else ''
        for char in value
    )

    # Limit length
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized.strip()


def validate_json_safe(data: dict) -> dict:
    """
    Validate JSON to prevent prototype pollution and injection
    """
    if not isinstance(data, dict):
        return data

    # List of dangerous keys
    dangerous_keys = ['__proto__', 'constructor', 'prototype']

    # Create clean dictionary
    clean_data = {}
    for key, value in data.items():
        if key in dangerous_keys:
            continue

        # Recursively validate nested objects
        if isinstance(value, dict):
            clean_data[key] = validate_json_safe(value)
        elif isinstance(value, list):
            clean_data[key] = [
                validate_json_safe(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            clean_data[key] = value

    return clean_data


def validate_path(path: str) -> bool:
    """
    Validate file path to prevent directory traversal
    """
    if not isinstance(path, str):
        return False

    # Check for directory traversal
    if '..' in path or '~' in path:
        return False

    # Check for null bytes
    if '\x00' in path:
        return False

    # Check for absolute paths (should be relative)
    if path.startswith('/') or (len(path) > 1 and path[1] == ':'):
        return False

    return True
