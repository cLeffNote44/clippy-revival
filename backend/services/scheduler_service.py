"""
Task scheduler service for running scheduled automation tasks
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field
import uuid
import logging

logger = logging.getLogger(__name__)


@dataclass
class ScheduledTask:
    """Represents a scheduled task"""
    id: str
    name: str
    action: str
    parameters: Dict[str, Any]
    schedule_type: str  # 'once', 'interval', 'daily', 'weekly'
    schedule_value: Any  # datetime for 'once', int (seconds) for 'interval', time for 'daily', etc.
    enabled: bool = True
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    run_count: int = 0
    error_count: int = 0
    last_error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)


class SchedulerService:
    """Manages scheduled task execution"""
    
    def __init__(self):
        self.tasks: Dict[str, ScheduledTask] = {}
        self.running = False
        self.task_handlers: Dict[str, Callable] = {}
        self._scheduler_task: Optional[asyncio.Task] = None
    
    def register_handler(self, action: str, handler: Callable):
        """Register a handler function for a task action"""
        self.task_handlers[action] = handler
        logger.info(f"Registered handler for action: {action}")
    
    def create_task(
        self,
        name: str,
        action: str,
        parameters: Dict[str, Any],
        schedule_type: str,
        schedule_value: Any
    ) -> str:
        """
        Create a new scheduled task
        
        Args:
            name: Human-readable task name
            action: Action to execute (must have registered handler)
            parameters: Parameters to pass to the handler
            schedule_type: 'once', 'interval', 'daily', 'weekly'
            schedule_value: Schedule details (depends on schedule_type)
        
        Returns:
            Task ID
        """
        if action not in self.task_handlers:
            raise ValueError(f"No handler registered for action: {action}")
        
        task_id = str(uuid.uuid4())
        
        task = ScheduledTask(
            id=task_id,
            name=name,
            action=action,
            parameters=parameters,
            schedule_type=schedule_type,
            schedule_value=schedule_value
        )
        
        # Calculate next run time
        task.next_run = self._calculate_next_run(task)
        
        self.tasks[task_id] = task
        logger.info(f"Created task: {name} ({task_id})")
        
        return task_id
    
    def _calculate_next_run(self, task: ScheduledTask) -> Optional[datetime]:
        """Calculate the next run time for a task"""
        now = datetime.now()
        
        if not task.enabled:
            return None
        
        if task.schedule_type == "once":
            # Run once at specified time
            if isinstance(task.schedule_value, datetime):
                if task.schedule_value > now and task.run_count == 0:
                    return task.schedule_value
            return None
        
        elif task.schedule_type == "interval":
            # Run every N seconds
            interval_seconds = task.schedule_value
            if task.last_run:
                return task.last_run + timedelta(seconds=interval_seconds)
            else:
                return now + timedelta(seconds=interval_seconds)
        
        elif task.schedule_type == "daily":
            # Run daily at specific time
            target_time = task.schedule_value  # Should be datetime.time object
            next_run = datetime.combine(now.date(), target_time)
            if next_run <= now:
                next_run += timedelta(days=1)
            return next_run
        
        elif task.schedule_type == "weekly":
            # Run weekly on specific day and time
            target_day, target_time = task.schedule_value  # (weekday, time)
            days_ahead = target_day - now.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            next_run = datetime.combine(now.date() + timedelta(days=days_ahead), target_time)
            if next_run <= now:
                next_run += timedelta(weeks=1)
            return next_run
        
        return None
    
    async def _execute_task(self, task: ScheduledTask):
        """Execute a scheduled task"""
        try:
            logger.info(f"Executing task: {task.name}")
            
            handler = self.task_handlers.get(task.action)
            if not handler:
                raise ValueError(f"Handler not found for action: {task.action}")
            
            # Execute the handler
            if asyncio.iscoroutinefunction(handler):
                await handler(**task.parameters)
            else:
                handler(**task.parameters)
            
            # Update task status
            task.last_run = datetime.now()
            task.run_count += 1
            task.last_error = None
            
            # Calculate next run
            task.next_run = self._calculate_next_run(task)
            
            logger.info(f"Task completed: {task.name}")
            
        except Exception as e:
            logger.error(f"Task failed: {task.name} - {str(e)}")
            task.error_count += 1
            task.last_error = str(e)
            
            # Still calculate next run for retry
            task.next_run = self._calculate_next_run(task)
    
    async def _scheduler_loop(self):
        """Main scheduler loop"""
        logger.info("Scheduler started")
        
        while self.running:
            try:
                now = datetime.now()
                
                # Check all tasks
                for task_id, task in list(self.tasks.items()):
                    if not task.enabled:
                        continue
                    
                    if task.next_run and task.next_run <= now:
                        # Execute task in background
                        asyncio.create_task(self._execute_task(task))
                
                # Sleep for 1 second before next check
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Scheduler loop error: {str(e)}")
                await asyncio.sleep(5)
    
    async def start(self):
        """Start the scheduler"""
        if self.running:
            logger.warning("Scheduler already running")
            return
        
        self.running = True
        self._scheduler_task = asyncio.create_task(self._scheduler_loop())
        logger.info("Scheduler service started")
    
    async def stop(self):
        """Stop the scheduler"""
        if not self.running:
            return
        
        self.running = False
        
        if self._scheduler_task:
            self._scheduler_task.cancel()
            try:
                await self._scheduler_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Scheduler service stopped")
    
    def get_task(self, task_id: str) -> Optional[ScheduledTask]:
        """Get a task by ID"""
        return self.tasks.get(task_id)
    
    def list_tasks(self, include_disabled: bool = True) -> List[ScheduledTask]:
        """List all tasks"""
        if include_disabled:
            return list(self.tasks.values())
        return [task for task in self.tasks.values() if task.enabled]
    
    def update_task(
        self,
        task_id: str,
        **updates
    ) -> bool:
        """Update a task's properties"""
        task = self.tasks.get(task_id)
        if not task:
            return False
        
        for key, value in updates.items():
            if hasattr(task, key):
                setattr(task, key, value)
        
        # Recalculate next run if schedule changed
        if any(k in updates for k in ['schedule_type', 'schedule_value', 'enabled']):
            task.next_run = self._calculate_next_run(task)
        
        return True
    
    def enable_task(self, task_id: str) -> bool:
        """Enable a task"""
        return self.update_task(task_id, enabled=True)
    
    def disable_task(self, task_id: str) -> bool:
        """Disable a task"""
        return self.update_task(task_id, enabled=False)
    
    def delete_task(self, task_id: str) -> bool:
        """Delete a task"""
        if task_id in self.tasks:
            del self.tasks[task_id]
            logger.info(f"Deleted task: {task_id}")
            return True
        return False
    
    def run_task_now(self, task_id: str):
        """Execute a task immediately (out of schedule)"""
        task = self.tasks.get(task_id)
        if not task:
            raise ValueError(f"Task not found: {task_id}")
        
        # Execute asynchronously
        asyncio.create_task(self._execute_task(task))


# Singleton instance
_scheduler_service = SchedulerService()

def get_scheduler_service() -> SchedulerService:
    """Get the singleton scheduler service instance"""
    return _scheduler_service
