"""
Clipboard Service
Manages clipboard history with AI categorization and search
"""

import json
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from services.logger import get_logger
from services.ollama_service import OllamaService

logger = get_logger("clipboard")


class ClipboardService:
    """Service for managing clipboard history"""

    def __init__(self, ollama_service: Optional[OllamaService] = None):
        self.clipboard_file = Path(__file__).parent.parent.parent / "clipboard_history.json"
        self.history: List[Dict] = []
        self.max_history_items = 1000
        self.ollama_service = ollama_service
        self.load_history()

    def load_history(self):
        """Load clipboard history from file"""
        if self.clipboard_file.exists():
            try:
                with open(self.clipboard_file, 'r', encoding='utf-8') as f:
                    self.history = json.load(f)
                logger.info(f"Loaded {len(self.history)} clipboard items")
            except Exception as e:
                logger.error(f"Failed to load clipboard history: {e}")
                self.history = []
        else:
            self.history = []

    def save_history(self):
        """Save clipboard history to file"""
        try:
            with open(self.clipboard_file, 'w', encoding='utf-8') as f:
                json.dump(self.history, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save clipboard history: {e}")

    async def add_item(self, content: str, content_type: str = "text", metadata: Optional[Dict] = None) -> Dict:
        """Add item to clipboard history"""
        try:
            # Don't add if it's exactly the same as the last item
            if self.history and self.history[0].get("content") == content:
                logger.debug("Duplicate clipboard content, skipping")
                return self.history[0]

            # Create new item
            item = {
                "id": self._generate_id(),
                "content": content,
                "type": content_type,
                "timestamp": datetime.utcnow().isoformat(),
                "category": "uncategorized",
                "pinned": False,
                "metadata": metadata or {}
            }

            # AI categorization if enabled and service available
            if self.ollama_service and len(content) < 1000:
                try:
                    category = await self._categorize_with_ai(content)
                    if category:
                        item["category"] = category
                except Exception as e:
                    logger.warning(f"AI categorization failed: {e}")

            # Add to history (at the beginning)
            self.history.insert(0, item)

            # Limit history size (keep pinned items)
            if len(self.history) > self.max_history_items:
                pinned_items = [item for item in self.history if item.get("pinned")]
                unpinned_items = [item for item in self.history if not item.get("pinned")]

                # Keep all pinned + most recent unpinned
                unpinned_items = unpinned_items[:self.max_history_items - len(pinned_items)]
                self.history = unpinned_items + pinned_items

            self.save_history()
            logger.info(f"Added clipboard item: {item['id']} (category: {item['category']})")

            return item

        except Exception as e:
            logger.error(f"Failed to add clipboard item: {e}")
            raise

    async def _categorize_with_ai(self, content: str) -> Optional[str]:
        """Use AI to categorize clipboard content"""
        if not self.ollama_service:
            return None

        try:
            # Limit content length for categorization
            preview = content[:200] if len(content) > 200 else content

            prompt = f"""Categorize this clipboard content into ONE word category (code, url, email, phone, address, text, number, json, xml, html, markdown, or other): "{preview}"

Respond with ONLY the category word, nothing else."""

            response = await self.ollama_service.chat(
                message=prompt,
                session_id="clipboard-categorization",
                stream=False
            )

            if response and isinstance(response, dict):
                category = response.get("response", "").strip().lower()
                # Validate category
                valid_categories = ["code", "url", "email", "phone", "address", "text",
                                   "number", "json", "xml", "html", "markdown", "other"]
                if category in valid_categories:
                    return category

        except Exception as e:
            logger.warning(f"AI categorization error: {e}")

        return None

    def get_history(self, limit: int = 100, offset: int = 0, category: Optional[str] = None,
                    search: Optional[str] = None, pinned_only: bool = False) -> List[Dict]:
        """Get clipboard history with filtering"""
        filtered = self.history.copy()

        # Filter by pinned
        if pinned_only:
            filtered = [item for item in filtered if item.get("pinned")]

        # Filter by category
        if category:
            filtered = [item for item in filtered if item.get("category") == category]

        # Search
        if search:
            search_lower = search.lower()
            filtered = [
                item for item in filtered
                if search_lower in item.get("content", "").lower() or
                   search_lower in item.get("category", "").lower()
            ]

        # Pagination
        total = len(filtered)
        filtered = filtered[offset:offset + limit]

        return {
            "items": filtered,
            "total": total,
            "limit": limit,
            "offset": offset
        }

    def get_item(self, item_id: str) -> Optional[Dict]:
        """Get specific clipboard item by ID"""
        for item in self.history:
            if item.get("id") == item_id:
                return item
        return None

    def update_item(self, item_id: str, updates: Dict) -> bool:
        """Update a clipboard item"""
        for i, item in enumerate(self.history):
            if item.get("id") == item_id:
                # Allow updating certain fields
                allowed_updates = ["category", "pinned", "metadata"]
                for key in allowed_updates:
                    if key in updates:
                        item[key] = updates[key]

                self.save_history()
                logger.info(f"Updated clipboard item: {item_id}")
                return True

        return False

    def delete_item(self, item_id: str) -> bool:
        """Delete a clipboard item"""
        for i, item in enumerate(self.history):
            if item.get("id") == item_id:
                self.history.pop(i)
                self.save_history()
                logger.info(f"Deleted clipboard item: {item_id}")
                return True

        return False

    def clear_history(self, keep_pinned: bool = True) -> int:
        """Clear clipboard history"""
        original_count = len(self.history)

        if keep_pinned:
            self.history = [item for item in self.history if item.get("pinned")]
        else:
            self.history = []

        self.save_history()
        deleted_count = original_count - len(self.history)
        logger.info(f"Cleared {deleted_count} clipboard items")

        return deleted_count

    def clear_old_items(self, days: int = 30) -> int:
        """Clear items older than specified days (except pinned)"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        original_count = len(self.history)

        self.history = [
            item for item in self.history
            if item.get("pinned") or
               datetime.fromisoformat(item.get("timestamp", "")) > cutoff_date
        ]

        self.save_history()
        deleted_count = original_count - len(self.history)
        logger.info(f"Cleared {deleted_count} old clipboard items")

        return deleted_count

    def get_statistics(self) -> Dict:
        """Get clipboard statistics"""
        category_counts = {}
        for item in self.history:
            category = item.get("category", "uncategorized")
            category_counts[category] = category_counts.get(category, 0) + 1

        # Find most common category
        most_common_category = max(category_counts.items(), key=lambda x: x[1])[0] if category_counts else None

        # Calculate date ranges
        oldest = None
        newest = None
        if self.history:
            timestamps = [datetime.fromisoformat(item.get("timestamp", "")) for item in self.history if item.get("timestamp")]
            if timestamps:
                oldest = min(timestamps).isoformat()
                newest = max(timestamps).isoformat()

        return {
            "total_items": len(self.history),
            "pinned_items": sum(1 for item in self.history if item.get("pinned")),
            "categories": category_counts,
            "most_common_category": most_common_category,
            "oldest_item": oldest,
            "newest_item": newest
        }

    async def analyze_with_ai(self, content: str) -> Optional[str]:
        """Analyze clipboard content with AI"""
        if not self.ollama_service:
            return None

        try:
            prompt = f"""Analyze this clipboard content and provide a brief summary (1-2 sentences):

Content:
{content[:500]}

Provide a concise summary."""

            response = await self.ollama_service.chat(
                message=prompt,
                session_id="clipboard-analysis",
                stream=False
            )

            if response and isinstance(response, dict):
                return response.get("response")

        except Exception as e:
            logger.error(f"AI analysis error: {e}")

        return None

    def _generate_id(self) -> str:
        """Generate unique ID for clipboard item"""
        import uuid
        return str(uuid.uuid4())


# Singleton instance
_clipboard_service = None


def get_clipboard_service(ollama_service: Optional[OllamaService] = None) -> ClipboardService:
    """Get or create clipboard service instance"""
    global _clipboard_service
    if _clipboard_service is None:
        _clipboard_service = ClipboardService(ollama_service)
    return _clipboard_service
