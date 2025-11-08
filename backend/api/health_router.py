"""
Health Check and Monitoring Router
Comprehensive health checks for production monitoring
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import psutil
import sys
from datetime import datetime, timedelta
from pathlib import Path

router = APIRouter(prefix="/health", tags=["health"])


class HealthStatus(BaseModel):
    """Health check response model"""
    status: str
    timestamp: str
    version: str
    uptime_seconds: float
    checks: Dict[str, bool]
    details: Optional[Dict] = None


class DetailedHealthStatus(BaseModel):
    """Detailed health status with metrics"""
    status: str
    timestamp: str
    version: str
    uptime_seconds: float
    system: Dict
    services: Dict
    resources: Dict


# Track application start time
APP_START_TIME = datetime.now()


@router.get("/", response_model=HealthStatus)
async def basic_health_check():
    """
    Basic health check endpoint
    Returns simple status for load balancers
    """
    uptime = (datetime.now() - APP_START_TIME).total_seconds()

    return HealthStatus(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0",
        uptime_seconds=uptime,
        checks={
            "api": True,
            "system": True
        }
    )


@router.get("/detailed", response_model=DetailedHealthStatus)
async def detailed_health_check():
    """
    Detailed health check with system metrics
    For monitoring dashboards and diagnostics
    """
    uptime = (datetime.now() - APP_START_TIME).total_seconds()

    # System resource checks
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')

    # Service checks
    services_status = {
        "ollama": check_ollama_availability(),
        "database": check_database_availability(),
        "filesystem": check_filesystem_writeable()
    }

    # Resource status
    resources = {
        "cpu_percent": cpu_percent,
        "memory_percent": memory.percent,
        "memory_available_gb": round(memory.available / (1024**3), 2),
        "disk_percent": disk.percent,
        "disk_free_gb": round(disk.free / (1024**3), 2)
    }

    # Overall status
    all_services_healthy = all(services_status.values())
    resources_healthy = (
        cpu_percent < 90 and
        memory.percent < 90 and
        disk.percent < 90
    )

    overall_status = "healthy" if (all_services_healthy and resources_healthy) else "degraded"

    return DetailedHealthStatus(
        status=overall_status,
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0",
        uptime_seconds=uptime,
        system={
            "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
            "platform": sys.platform,
            "process_id": psutil.Process().pid
        },
        services=services_status,
        resources=resources
    )


@router.get("/ready")
async def readiness_check():
    """
    Readiness check for Kubernetes/container orchestration
    Returns 200 when app is ready to serve traffic
    """
    # Check critical services
    if not check_database_availability():
        raise HTTPException(status_code=503, detail="Database not available")

    if not check_filesystem_writeable():
        raise HTTPException(status_code=503, detail="Filesystem not writeable")

    return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}


@router.get("/live")
async def liveness_check():
    """
    Liveness check for Kubernetes/container orchestration
    Returns 200 if application process is alive
    """
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}


@router.get("/metrics/prometheus")
async def prometheus_metrics():
    """
    Prometheus-compatible metrics endpoint
    Returns metrics in Prometheus text format
    """
    uptime = (datetime.now() - APP_START_TIME).total_seconds()
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')

    metrics = [
        f"# HELP clippy_uptime_seconds Application uptime in seconds",
        f"# TYPE clippy_uptime_seconds gauge",
        f"clippy_uptime_seconds {uptime}",
        f"",
        f"# HELP clippy_cpu_usage_percent CPU usage percentage",
        f"# TYPE clippy_cpu_usage_percent gauge",
        f"clippy_cpu_usage_percent {cpu_percent}",
        f"",
        f"# HELP clippy_memory_usage_percent Memory usage percentage",
        f"# TYPE clippy_memory_usage_percent gauge",
        f"clippy_memory_usage_percent {memory.percent}",
        f"",
        f"# HELP clippy_disk_usage_percent Disk usage percentage",
        f"# TYPE clippy_disk_usage_percent gauge",
        f"clippy_disk_usage_percent {disk.percent}",
        f"",
        f"# HELP clippy_memory_available_bytes Available memory in bytes",
        f"# TYPE clippy_memory_available_bytes gauge",
        f"clippy_memory_available_bytes {memory.available}",
        f"",
    ]

    return "\n".join(metrics)


def check_ollama_availability() -> bool:
    """Check if Ollama service is available"""
    try:
        import httpx
        from backend.config import config

        response = httpx.get(f"{config.OLLAMA_HOST}/api/version", timeout=2)
        return response.status_code == 200
    except:
        return False


def check_database_availability() -> bool:
    """Check if database is available and writeable"""
    try:
        from services.conversation_db import get_conversation_db
        db = get_conversation_db()
        # Try a simple query
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            return True
    except:
        return False


def check_filesystem_writeable() -> bool:
    """Check if filesystem is writeable"""
    try:
        test_file = Path(__file__).parent.parent / "data" / ".health_check"
        test_file.parent.mkdir(exist_ok=True)
        test_file.write_text("ok")
        test_file.unlink()
        return True
    except:
        return False
