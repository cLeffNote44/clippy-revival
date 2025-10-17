"""
Built-in task handlers for the scheduler service
"""

import os
import psutil
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


async def system_cleanup(**kwargs):
    """Clean up temporary files and free up disk space"""
    logger.info("Running system cleanup task")
    
    # Windows temp directories
    temp_dirs = [
        os.environ.get('TEMP', ''),
        os.environ.get('TMP', ''),
        os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Temp')
    ]
    
    cleaned_size = 0
    cleaned_files = 0
    
    for temp_dir in temp_dirs:
        if not temp_dir or not os.path.exists(temp_dir):
            continue
            
        try:
            for root, dirs, files in os.walk(temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    try:
                        # Skip files modified in last 24 hours
                        if os.path.getmtime(file_path) > datetime.now().timestamp() - 86400:
                            continue
                        
                        file_size = os.path.getsize(file_path)
                        os.remove(file_path)
                        cleaned_size += file_size
                        cleaned_files += 1
                    except:
                        pass  # Skip files we can't delete
        except:
            pass
    
    logger.info(f"Cleaned {cleaned_files} files, freed {cleaned_size / 1024 / 1024:.2f} MB")
    return {"files_cleaned": cleaned_files, "space_freed_mb": cleaned_size / 1024 / 1024}


async def system_health_check(**kwargs):
    """Check system health metrics"""
    logger.info("Running system health check")
    
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    health_report = {
        "timestamp": datetime.now().isoformat(),
        "cpu_percent": cpu_percent,
        "memory_percent": memory.percent,
        "memory_available_gb": memory.available / (1024 ** 3),
        "disk_percent": disk.percent,
        "disk_free_gb": disk.free / (1024 ** 3),
        "status": "healthy"
    }
    
    # Determine health status
    if cpu_percent > 90 or memory.percent > 90 or disk.percent > 90:
        health_report["status"] = "critical"
    elif cpu_percent > 75 or memory.percent > 75 or disk.percent > 85:
        health_report["status"] = "warning"
    
    logger.info(f"System health: {health_report['status']}")
    return health_report


async def backup_reminder(**kwargs):
    """Send reminder to backup important files"""
    logger.info("Backup reminder triggered")
    
    # In a real implementation, this would:
    # - Check when the last backup was performed
    # - Send a notification to the user
    # - Possibly trigger an automated backup
    
    message = kwargs.get('message', 'Remember to backup your important files!')
    
    return {
        "type": "reminder",
        "message": message,
        "timestamp": datetime.now().isoformat()
    }


async def log_rotation(**kwargs):
    """Rotate application logs"""
    logger.info("Rotating logs")
    
    log_dir = kwargs.get('log_dir', './logs')
    max_size_mb = kwargs.get('max_size_mb', 10)
    max_files = kwargs.get('max_files', 5)
    
    if not os.path.exists(log_dir):
        return {"status": "skipped", "reason": "log directory not found"}
    
    rotated_count = 0
    
    for log_file in os.listdir(log_dir):
        if not log_file.endswith('.log'):
            continue
            
        log_path = os.path.join(log_dir, log_file)
        
        try:
            size_mb = os.path.getsize(log_path) / (1024 * 1024)
            
            if size_mb > max_size_mb:
                # Rotate the log
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                new_name = f"{log_file}.{timestamp}"
                os.rename(log_path, os.path.join(log_dir, new_name))
                rotated_count += 1
                
                # Create new empty log file
                open(log_path, 'a').close()
                
        except Exception as e:
            logger.error(f"Failed to rotate {log_file}: {e}")
    
    # Clean up old rotated logs
    rotated_logs = sorted([f for f in os.listdir(log_dir) if '.' in f and f.split('.')[-1].isdigit()])
    
    if len(rotated_logs) > max_files:
        for old_log in rotated_logs[:-max_files]:
            try:
                os.remove(os.path.join(log_dir, old_log))
            except:
                pass
    
    return {"rotated_files": rotated_count}


def register_default_handlers(scheduler_service):
    """Register all default task handlers with the scheduler"""
    scheduler_service.register_handler('system_cleanup', system_cleanup)
    scheduler_service.register_handler('system_health_check', system_health_check)
    scheduler_service.register_handler('backup_reminder', backup_reminder)
    scheduler_service.register_handler('log_rotation', log_rotation)