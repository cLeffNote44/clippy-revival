from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime, time

from backend.services.scheduler_service import get_scheduler_service

router = APIRouter(prefix="/scheduler", tags=["scheduler"])

class TaskCreate(BaseModel):
    name: str
    action: str
    parameters: Dict[str, Any]
    schedule_type: str  # 'once', 'interval', 'daily', 'weekly'
    schedule_value: Any

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    schedule_type: Optional[str] = None
    schedule_value: Optional[Any] = None
    enabled: Optional[bool] = None

class TaskResponse(BaseModel):
    id: str
    name: str
    action: str
    parameters: Dict[str, Any]
    schedule_type: str
    schedule_value: Any
    enabled: bool
    last_run: Optional[datetime]
    next_run: Optional[datetime]
    run_count: int
    error_count: int
    last_error: Optional[str]
    created_at: datetime

@router.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate):
    """Create a new scheduled task"""
    try:
        scheduler = get_scheduler_service()
        
        task_id = scheduler.create_task(
            name=task.name,
            action=task.action,
            parameters=task.parameters,
            schedule_type=task.schedule_type,
            schedule_value=task.schedule_value
        )
        
        created_task = scheduler.get_task(task_id)
        
        return TaskResponse(
            id=created_task.id,
            name=created_task.name,
            action=created_task.action,
            parameters=created_task.parameters,
            schedule_type=created_task.schedule_type,
            schedule_value=created_task.schedule_value,
            enabled=created_task.enabled,
            last_run=created_task.last_run,
            next_run=created_task.next_run,
            run_count=created_task.run_count,
            error_count=created_task.error_count,
            last_error=created_task.last_error,
            created_at=created_task.created_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")

@router.get("/tasks", response_model=List[TaskResponse])
async def list_tasks(include_disabled: bool = True):
    """List all scheduled tasks"""
    try:
        scheduler = get_scheduler_service()
        tasks = scheduler.list_tasks(include_disabled=include_disabled)
        
        return [
            TaskResponse(
                id=task.id,
                name=task.name,
                action=task.action,
                parameters=task.parameters,
                schedule_type=task.schedule_type,
                schedule_value=task.schedule_value,
                enabled=task.enabled,
                last_run=task.last_run,
                next_run=task.next_run,
                run_count=task.run_count,
                error_count=task.error_count,
                last_error=task.last_error,
                created_at=task.created_at
            )
            for task in tasks
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list tasks: {str(e)}")

@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """Get a specific task by ID"""
    try:
        scheduler = get_scheduler_service()
        task = scheduler.get_task(task_id)
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return TaskResponse(
            id=task.id,
            name=task.name,
            action=task.action,
            parameters=task.parameters,
            schedule_type=task.schedule_type,
            schedule_value=task.schedule_value,
            enabled=task.enabled,
            last_run=task.last_run,
            next_run=task.next_run,
            run_count=task.run_count,
            error_count=task.error_count,
            last_error=task.last_error,
            created_at=task.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get task: {str(e)}")

@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, updates: TaskUpdate):
    """Update a task"""
    try:
        scheduler = get_scheduler_service()
        
        update_dict = {k: v for k, v in updates.dict().items() if v is not None}
        
        success = scheduler.update_task(task_id, **update_dict)
        
        if not success:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task = scheduler.get_task(task_id)
        
        return TaskResponse(
            id=task.id,
            name=task.name,
            action=task.action,
            parameters=task.parameters,
            schedule_type=task.schedule_type,
            schedule_value=task.schedule_value,
            enabled=task.enabled,
            last_run=task.last_run,
            next_run=task.next_run,
            run_count=task.run_count,
            error_count=task.error_count,
            last_error=task.last_error,
            created_at=task.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

@router.post("/tasks/{task_id}/enable")
async def enable_task(task_id: str):
    """Enable a task"""
    try:
        scheduler = get_scheduler_service()
        success = scheduler.enable_task(task_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return {"success": True, "message": "Task enabled"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to enable task: {str(e)}")

@router.post("/tasks/{task_id}/disable")
async def disable_task(task_id: str):
    """Disable a task"""
    try:
        scheduler = get_scheduler_service()
        success = scheduler.disable_task(task_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return {"success": True, "message": "Task disabled"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to disable task: {str(e)}")

@router.post("/tasks/{task_id}/run")
async def run_task_now(task_id: str):
    """Execute a task immediately"""
    try:
        scheduler = get_scheduler_service()
        scheduler.run_task_now(task_id)
        
        return {"success": True, "message": "Task execution started"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run task: {str(e)}")

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task"""
    try:
        scheduler = get_scheduler_service()
        success = scheduler.delete_task(task_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return {"success": True, "message": "Task deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")
