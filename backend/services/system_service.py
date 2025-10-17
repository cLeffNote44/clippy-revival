import psutil
import asyncio
from typing import Dict, Any

class SystemService:
    def __init__(self):
        self.monitoring = False
        self.monitor_task = None

    async def get_metrics(self) -> Dict[str, Any]:
        """Get current system metrics"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Network I/O
        net_io = psutil.net_io_counters()
        
        return {
            "cpu": cpu_percent,
            "memory": memory.percent,
            "disk": disk.percent,
            "network": {
                "upload": net_io.bytes_sent / 1024,  # KB
                "download": net_io.bytes_recv / 1024  # KB
            }
        }

    async def start_monitoring(self, ws_manager):
        """Start continuous monitoring and broadcast metrics"""
        self.monitoring = True
        
        while self.monitoring:
            try:
                metrics = await self.get_metrics()
                await ws_manager.broadcast(
                    {"type": "system.metrics", "payload": metrics},
                    "system.metrics"
                )
                await asyncio.sleep(2)  # Update every 2 seconds
            except Exception as e:
                print(f"Error in system monitoring: {e}")
                await asyncio.sleep(5)

    def stop_monitoring(self):
        """Stop monitoring"""
        self.monitoring = False