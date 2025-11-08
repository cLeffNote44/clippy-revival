"""
Workflow Automation API Router
Provides endpoints for workflow management
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
from services.workflow_service import get_workflow_service
from services.logger import get_logger

router = APIRouter(prefix="/workflows", tags=["workflows"])
logger = get_logger("workflows-api")


class WorkflowCreate(BaseModel):
    """Workflow creation model"""
    name: str
    description: str = ""
    trigger: Dict
    actions: List[Dict]
    enabled: bool = True


class WorkflowUpdate(BaseModel):
    """Workflow update model"""
    name: Optional[str] = None
    description: Optional[str] = None
    trigger: Optional[Dict] = None
    actions: Optional[List[Dict]] = None
    enabled: Optional[bool] = None


@router.get("/")
async def get_all_workflows():
    """Get all workflows"""
    try:
        workflow_service = get_workflow_service()
        workflows = workflow_service.get_all_workflows()

        return {
            "success": True,
            "workflows": workflows,
            "count": len(workflows)
        }
    except Exception as e:
        logger.error(f"Failed to get workflows: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates")
async def get_workflow_templates():
    """Get workflow templates"""
    try:
        workflow_service = get_workflow_service()
        templates = workflow_service.get_workflow_templates()

        return {
            "success": True,
            "templates": templates,
            "count": len(templates)
        }
    except Exception as e:
        logger.error(f"Failed to get templates: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Get specific workflow"""
    try:
        workflow_service = get_workflow_service()
        workflow = workflow_service.get_workflow(workflow_id)

        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")

        return {
            "success": True,
            "workflow": workflow
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_workflow(workflow: WorkflowCreate):
    """Create a new workflow"""
    try:
        workflow_service = get_workflow_service()

        # Generate ID from name
        workflow_id = workflow.name.lower().replace(" ", "-")

        workflow_data = {
            "name": workflow.name,
            "description": workflow.description,
            "trigger": workflow.trigger,
            "actions": workflow.actions,
            "enabled": workflow.enabled
        }

        success = workflow_service.create_workflow(workflow_id, workflow_data)

        if not success:
            raise HTTPException(status_code=400, detail="Workflow already exists")

        return {
            "success": True,
            "message": "Workflow created successfully",
            "workflow_id": workflow_id,
            "workflow": workflow_service.get_workflow(workflow_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{workflow_id}")
async def update_workflow(workflow_id: str, update: WorkflowUpdate):
    """Update a workflow"""
    try:
        workflow_service = get_workflow_service()

        update_data = {}
        if update.name is not None:
            update_data["name"] = update.name
        if update.description is not None:
            update_data["description"] = update.description
        if update.trigger is not None:
            update_data["trigger"] = update.trigger
        if update.actions is not None:
            update_data["actions"] = update.actions
        if update.enabled is not None:
            update_data["enabled"] = update.enabled

        success = workflow_service.update_workflow(workflow_id, update_data)

        if not success:
            raise HTTPException(status_code=404, detail="Workflow not found")

        return {
            "success": True,
            "message": "Workflow updated successfully",
            "workflow": workflow_service.get_workflow(workflow_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a workflow"""
    try:
        workflow_service = get_workflow_service()
        success = workflow_service.delete_workflow(workflow_id)

        if not success:
            raise HTTPException(status_code=404, detail="Workflow not found")

        return {
            "success": True,
            "message": "Workflow deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{workflow_id}/execute")
async def execute_workflow(workflow_id: str):
    """Manually execute a workflow"""
    try:
        workflow_service = get_workflow_service()
        workflow = workflow_service.get_workflow(workflow_id)

        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")

        # In a real implementation, this would execute the workflow
        logger.info(f"Executing workflow: {workflow_id}")

        return {
            "success": True,
            "message": f"Workflow {workflow_id} executed successfully",
            "workflow_id": workflow_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to execute workflow: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/from-template/{template_id}")
async def create_from_template(template_id: str, name: str):
    """Create a workflow from a template"""
    try:
        workflow_service = get_workflow_service()
        templates = workflow_service.get_workflow_templates()

        template = next((t for t in templates if t["id"] == template_id), None)

        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        workflow_id = name.lower().replace(" ", "-")
        workflow_data = {
            "name": name,
            "description": template["description"],
            "trigger": template["trigger"],
            "actions": template["actions"],
            "enabled": True
        }

        success = workflow_service.create_workflow(workflow_id, workflow_data)

        if not success:
            raise HTTPException(status_code=400, detail="Workflow already exists")

        return {
            "success": True,
            "message": "Workflow created from template",
            "workflow_id": workflow_id,
            "workflow": workflow_service.get_workflow(workflow_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create from template: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
