"""
Workflow Automation Service
Manages automated workflows with triggers and actions
"""

import json
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
from services.logger import get_logger

logger = get_logger("workflow")


class WorkflowService:
    """Service for managing automated workflows"""

    def __init__(self):
        self.workflows_file = Path(__file__).parent.parent.parent / "workflows.json"
        self.workflows: Dict[str, Dict] = {}
        self.load_workflows()

    def load_workflows(self):
        """Load workflows from file"""
        if self.workflows_file.exists():
            try:
                with open(self.workflows_file, 'r') as f:
                    self.workflows = json.load(f)
                logger.info(f"Loaded {len(self.workflows)} workflows")
            except Exception as e:
                logger.error(f"Failed to load workflows: {e}")
                self.workflows = {}
        else:
            self.workflows = {}

    def save_workflows(self):
        """Save workflows to file"""
        try:
            with open(self.workflows_file, 'w') as f:
                json.dump(self.workflows, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save workflows: {e}")

    def get_all_workflows(self) -> List[Dict]:
        """Get all workflows"""
        return [{"id": k, **v} for k, v in self.workflows.items()]

    def get_workflow(self, workflow_id: str) -> Optional[Dict]:
        """Get specific workflow"""
        workflow = self.workflows.get(workflow_id)
        if workflow:
            return {"id": workflow_id, **workflow}
        return None

    def create_workflow(self, workflow_id: str, workflow_data: Dict) -> bool:
        """Create a new workflow"""
        if workflow_id in self.workflows:
            logger.warning(f"Workflow {workflow_id} already exists")
            return False

        self.workflows[workflow_id] = {
            "name": workflow_data.get("name", "Unnamed Workflow"),
            "description": workflow_data.get("description", ""),
            "trigger": workflow_data.get("trigger", {}),
            "actions": workflow_data.get("actions", []),
            "enabled": workflow_data.get("enabled", True),
            "created_at": datetime.utcnow().isoformat()
        }

        self.save_workflows()
        logger.info(f"Created workflow: {workflow_id}")
        return True

    def update_workflow(self, workflow_id: str, updates: Dict) -> bool:
        """Update a workflow"""
        if workflow_id not in self.workflows:
            return False

        self.workflows[workflow_id].update(updates)
        self.save_workflows()
        logger.info(f"Updated workflow: {workflow_id}")
        return True

    def delete_workflow(self, workflow_id: str) -> bool:
        """Delete a workflow"""
        if workflow_id not in self.workflows:
            return False

        del self.workflows[workflow_id]
        self.save_workflows()
        logger.info(f"Deleted workflow: {workflow_id}")
        return True

    def get_workflow_templates(self) -> List[Dict]:
        """Get workflow templates"""
        return [
            {
                "id": "auto-backup",
                "name": "Auto Backup",
                "description": "Automatically backup files every day",
                "trigger": {"type": "schedule", "cron": "0 0 * * *"},
                "actions": [
                    {"type": "backup_files", "path": "~/Documents"},
                    {"type": "notification", "message": "Backup completed"}
                ]
            },
            {
                "id": "morning-briefing",
                "name": "Morning Briefing",
                "description": "Get a morning briefing at 9 AM",
                "trigger": {"type": "schedule", "cron": "0 9 * * *"},
                "actions": [
                    {"type": "ai_chat", "prompt": "Give me a brief morning summary"},
                    {"type": "notification", "message": "Morning briefing ready"}
                ]
            },
            {
                "id": "clipboard-logger",
                "name": "Clipboard Logger",
                "description": "Log important clipboard items automatically",
                "trigger": {"type": "clipboard_change"},
                "actions": [
                    {"type": "save_to_file", "file": "clipboard_log.txt"},
                    {"type": "categorize", "use_ai": True}
                ]
            }
        ]


# Singleton
_workflow_service = None

def get_workflow_service() -> WorkflowService:
    global _workflow_service
    if _workflow_service is None:
        _workflow_service = WorkflowService()
    return _workflow_service
