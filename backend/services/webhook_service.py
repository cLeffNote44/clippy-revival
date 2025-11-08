"""
Webhook Service - Send and receive webhooks for integrations
"""

import asyncio
import aiohttp
from typing import Dict, List, Optional
import json
from datetime import datetime
from pathlib import Path
from services.logger import get_logger

logger = get_logger("webhook")


class WebhookService:
    """
    Webhook service for integrations with external services

    Features:
    - Send webhooks to external URLs
    - Receive webhook events
    - Webhook management (CRUD)
    - Retry logic with exponential backoff
    - Webhook event history
    """

    def __init__(self, webhooks_file: str = "data/webhooks.json"):
        self.webhooks_file = Path(webhooks_file)
        self.webhooks_file.parent.mkdir(parents=True, exist_ok=True)

        # Load webhooks from storage
        self.webhooks = self._load_webhooks()

        # Event history (in-memory, could be persisted)
        self.event_history: List[Dict] = []
        self.max_history = 100

    def _load_webhooks(self) -> Dict:
        """Load webhooks from file"""
        if self.webhooks_file.exists():
            try:
                with open(self.webhooks_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading webhooks: {e}")
                return {"webhooks": []}
        return {"webhooks": []}

    def _save_webhooks(self):
        """Save webhooks to file"""
        try:
            with open(self.webhooks_file, 'w') as f:
                json.dump(self.webhooks, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving webhooks: {e}")

    def add_webhook(self, url: str, events: List[str], name: Optional[str] = None,
                   headers: Optional[Dict] = None, enabled: bool = True) -> Dict:
        """
        Add a new webhook

        Args:
            url: Webhook URL to send events to
            events: List of event types to trigger this webhook
            name: Optional friendly name
            headers: Optional custom headers
            enabled: Whether webhook is active

        Returns:
            Webhook object
        """
        webhook = {
            "id": f"webhook_{len(self.webhooks.get('webhooks', []))}",
            "name": name or f"Webhook {len(self.webhooks.get('webhooks', []))}",
            "url": url,
            "events": events,
            "headers": headers or {},
            "enabled": enabled,
            "created_at": datetime.now().isoformat(),
            "last_triggered": None,
            "success_count": 0,
            "failure_count": 0
        }

        self.webhooks.setdefault("webhooks", []).append(webhook)
        self._save_webhooks()

        logger.info(f"Webhook added: {webhook['name']} ({webhook['id']})")
        return webhook

    def remove_webhook(self, webhook_id: str) -> bool:
        """Remove a webhook by ID"""
        webhooks_list = self.webhooks.get("webhooks", [])
        original_len = len(webhooks_list)

        self.webhooks["webhooks"] = [
            w for w in webhooks_list if w["id"] != webhook_id
        ]

        if len(self.webhooks["webhooks"]) < original_len:
            self._save_webhooks()
            logger.info(f"Webhook removed: {webhook_id}")
            return True

        return False

    def update_webhook(self, webhook_id: str, updates: Dict) -> Optional[Dict]:
        """Update a webhook"""
        for webhook in self.webhooks.get("webhooks", []):
            if webhook["id"] == webhook_id:
                webhook.update(updates)
                self._save_webhooks()
                logger.info(f"Webhook updated: {webhook_id}")
                return webhook

        return None

    def get_webhook(self, webhook_id: str) -> Optional[Dict]:
        """Get a webhook by ID"""
        for webhook in self.webhooks.get("webhooks", []):
            if webhook["id"] == webhook_id:
                return webhook
        return None

    def list_webhooks(self) -> List[Dict]:
        """List all webhooks"""
        return self.webhooks.get("webhooks", [])

    async def trigger_webhooks(self, event_type: str, data: Dict) -> List[Dict]:
        """
        Trigger all webhooks for a specific event type

        Args:
            event_type: Type of event (e.g., "ai.chat", "system.alert")
            data: Event data to send

        Returns:
            List of results for each triggered webhook
        """
        results = []
        event_payload = {
            "event": event_type,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }

        # Find matching webhooks
        matching_webhooks = [
            w for w in self.webhooks.get("webhooks", [])
            if w["enabled"] and (event_type in w["events"] or "*" in w["events"])
        ]

        logger.info(f"Triggering {len(matching_webhooks)} webhooks for event: {event_type}")

        # Send webhooks concurrently
        tasks = [
            self._send_webhook(webhook, event_payload)
            for webhook in matching_webhooks
        ]

        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)

        # Record event
        self._record_event(event_type, data, results)

        return results

    async def _send_webhook(self, webhook: Dict, payload: Dict,
                           retry_count: int = 0, max_retries: int = 3) -> Dict:
        """
        Send a webhook with retry logic

        Args:
            webhook: Webhook configuration
            payload: Event payload
            retry_count: Current retry attempt
            max_retries: Maximum number of retries

        Returns:
            Result dict with status and details
        """
        try:
            # Prepare request
            headers = {
                "Content-Type": "application/json",
                **webhook.get("headers", {})
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook["url"],
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    response_text = await response.text()

                    if response.status < 400:
                        # Success
                        webhook["last_triggered"] = datetime.now().isoformat()
                        webhook["success_count"] = webhook.get("success_count", 0) + 1
                        self._save_webhooks()

                        logger.info(f"Webhook sent successfully: {webhook['name']}")
                        return {
                            "webhook_id": webhook["id"],
                            "success": True,
                            "status_code": response.status,
                            "response": response_text[:200]  # Limit response size
                        }
                    else:
                        raise Exception(f"HTTP {response.status}: {response_text[:200]}")

        except Exception as e:
            logger.error(f"Webhook failed: {webhook['name']} - {e}")

            # Retry with exponential backoff
            if retry_count < max_retries:
                wait_time = 2 ** retry_count  # 1s, 2s, 4s
                logger.info(f"Retrying webhook in {wait_time}s...")
                await asyncio.sleep(wait_time)
                return await self._send_webhook(webhook, payload, retry_count + 1, max_retries)
            else:
                # Max retries exceeded
                webhook["failure_count"] = webhook.get("failure_count", 0) + 1
                self._save_webhooks()

                return {
                    "webhook_id": webhook["id"],
                    "success": False,
                    "error": str(e),
                    "retries": retry_count
                }

    def _record_event(self, event_type: str, data: Dict, results: List[Dict]):
        """Record webhook event in history"""
        event_record = {
            "event_type": event_type,
            "timestamp": datetime.now().isoformat(),
            "data": data,
            "webhooks_triggered": len([r for r in results if isinstance(r, dict)]),
            "webhooks_succeeded": len([r for r in results if isinstance(r, dict) and r.get("success")]),
            "webhooks_failed": len([r for r in results if isinstance(r, dict) and not r.get("success")])
        }

        self.event_history.append(event_record)

        # Limit history size
        if len(self.event_history) > self.max_history:
            self.event_history = self.event_history[-self.max_history:]

    def get_event_history(self, limit: int = 50) -> List[Dict]:
        """Get recent webhook events"""
        return self.event_history[-limit:]

    def get_webhook_stats(self, webhook_id: str) -> Optional[Dict]:
        """Get statistics for a webhook"""
        webhook = self.get_webhook(webhook_id)
        if not webhook:
            return None

        return {
            "id": webhook["id"],
            "name": webhook["name"],
            "success_count": webhook.get("success_count", 0),
            "failure_count": webhook.get("failure_count", 0),
            "last_triggered": webhook.get("last_triggered"),
            "success_rate": (
                webhook.get("success_count", 0) /
                max(1, webhook.get("success_count", 0) + webhook.get("failure_count", 0))
            ) * 100
        }
