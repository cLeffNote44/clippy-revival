"""
Conversation Database Service
SQLite-based persistent storage for chat conversations and history
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Any
from contextlib import contextmanager
from services.logger import get_logger

logger = get_logger("conversation_db")


class ConversationDB:
    """Manages persistent storage of conversations using SQLite"""

    def __init__(self, db_path: Optional[str] = None):
        """
        Initialize the conversation database

        Args:
            db_path: Path to SQLite database file (defaults to backend/data/conversations.db)
        """
        if db_path is None:
            data_dir = Path(__file__).parent.parent / "data"
            data_dir.mkdir(exist_ok=True)
            db_path = str(data_dir / "conversations.db")

        self.db_path = db_path
        self.init_database()
        logger.info(f"ConversationDB initialized at {db_path}")

    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error: {e}", exc_info=True)
            raise
        finally:
            conn.close()

    def init_database(self):
        """Initialize database schema"""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Sessions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    model TEXT,
                    metadata TEXT
                )
            """)

            # Messages table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    metadata TEXT,
                    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
                )
            """)

            # Create indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_messages_session
                ON messages(session_id)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_messages_timestamp
                ON messages(timestamp)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_sessions_updated
                ON sessions(updated_at)
            """)

            logger.debug("Database schema initialized")

    def create_session(self, session_id: str, model: str = None, metadata: Dict = None) -> bool:
        """
        Create a new conversation session

        Args:
            session_id: Unique session identifier
            model: AI model name
            metadata: Additional session metadata

        Returns:
            True if created, False if already exists
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO sessions (session_id, model, metadata)
                    VALUES (?, ?, ?)
                """, (session_id, model, json.dumps(metadata or {})))

                logger.info(f"Created session {session_id}")
                return True
        except sqlite3.IntegrityError:
            logger.warning(f"Session {session_id} already exists")
            return False

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        metadata: Dict = None
    ) -> int:
        """
        Add a message to a session

        Args:
            session_id: Session identifier
            role: Message role (user, assistant, system)
            content: Message content
            metadata: Additional message metadata

        Returns:
            Message ID
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Insert message
            cursor.execute("""
                INSERT INTO messages (session_id, role, content, metadata)
                VALUES (?, ?, ?, ?)
            """, (session_id, role, content, json.dumps(metadata or {})))

            message_id = cursor.lastrowid

            # Update session timestamp
            cursor.execute("""
                UPDATE sessions
                SET updated_at = CURRENT_TIMESTAMP
                WHERE session_id = ?
            """, (session_id,))

            logger.debug(f"Added message {message_id} to session {session_id}")
            return message_id

    def get_session_messages(
        self,
        session_id: str,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Dict]:
        """
        Retrieve messages for a session

        Args:
            session_id: Session identifier
            limit: Maximum number of messages to retrieve
            offset: Number of messages to skip

        Returns:
            List of message dictionaries
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()

            query = """
                SELECT id, role, content, timestamp, metadata
                FROM messages
                WHERE session_id = ?
                ORDER BY timestamp ASC
            """
            params = [session_id]

            if limit:
                query += " LIMIT ? OFFSET ?"
                params.extend([limit, offset])

            cursor.execute(query, params)

            messages = []
            for row in cursor.fetchall():
                messages.append({
                    "id": row["id"],
                    "role": row["role"],
                    "content": row["content"],
                    "timestamp": row["timestamp"],
                    "metadata": json.loads(row["metadata"]) if row["metadata"] else {}
                })

            return messages

    def get_session_history(self, session_id: str, max_messages: int = 100) -> List[Dict]:
        """
        Get session history in Ollama format

        Args:
            session_id: Session identifier
            max_messages: Maximum messages to return

        Returns:
            List of messages in format [{"role": "user", "content": "..."}]
        """
        messages = self.get_session_messages(session_id, limit=max_messages)
        return [
            {"role": msg["role"], "content": msg["content"]}
            for msg in messages
        ]

    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session and all its messages

        Args:
            session_id: Session identifier

        Returns:
            True if deleted, False if not found
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))

            if cursor.rowcount > 0:
                logger.info(f"Deleted session {session_id}")
                return True
            return False

    def clear_old_sessions(self, days: int = 30) -> int:
        """
        Clear sessions older than specified days

        Args:
            days: Number of days to keep

        Returns:
            Number of sessions deleted
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                DELETE FROM sessions
                WHERE updated_at < datetime('now', '-' || ? || ' days')
            """, (days,))

            count = cursor.rowcount
            logger.info(f"Deleted {count} old sessions")
            return count

    def get_session_stats(self, session_id: str) -> Dict:
        """
        Get statistics for a session

        Args:
            session_id: Session identifier

        Returns:
            Dictionary with session statistics
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Get session info
            cursor.execute("""
                SELECT created_at, updated_at, model, metadata
                FROM sessions
                WHERE session_id = ?
            """, (session_id,))

            session = cursor.fetchone()
            if not session:
                return None

            # Get message counts
            cursor.execute("""
                SELECT
                    COUNT(*) as total_messages,
                    SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_messages,
                    SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) as assistant_messages
                FROM messages
                WHERE session_id = ?
            """, (session_id,))

            stats = cursor.fetchone()

            return {
                "session_id": session_id,
                "created_at": session["created_at"],
                "updated_at": session["updated_at"],
                "model": session["model"],
                "metadata": json.loads(session["metadata"]) if session["metadata"] else {},
                "total_messages": stats["total_messages"],
                "user_messages": stats["user_messages"],
                "assistant_messages": stats["assistant_messages"]
            }

    def list_sessions(self, limit: int = 50, offset: int = 0) -> List[Dict]:
        """
        List all sessions

        Args:
            limit: Maximum number of sessions to return
            offset: Number of sessions to skip

        Returns:
            List of session dictionaries
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT session_id, created_at, updated_at, model, metadata,
                       (SELECT COUNT(*) FROM messages WHERE messages.session_id = sessions.session_id) as message_count
                FROM sessions
                ORDER BY updated_at DESC
                LIMIT ? OFFSET ?
            """, (limit, offset))

            sessions = []
            for row in cursor.fetchall():
                sessions.append({
                    "session_id": row["session_id"],
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                    "model": row["model"],
                    "metadata": json.loads(row["metadata"]) if row["metadata"] else {},
                    "message_count": row["message_count"]
                })

            return sessions

    def search_messages(self, query: str, limit: int = 50) -> List[Dict]:
        """
        Search messages by content

        Args:
            query: Search query
            limit: Maximum results

        Returns:
            List of matching messages
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT m.id, m.session_id, m.role, m.content, m.timestamp, s.model
                FROM messages m
                JOIN sessions s ON m.session_id = s.session_id
                WHERE m.content LIKE ?
                ORDER BY m.timestamp DESC
                LIMIT ?
            """, (f"%{query}%", limit))

            results = []
            for row in cursor.fetchall():
                results.append({
                    "id": row["id"],
                    "session_id": row["session_id"],
                    "role": row["role"],
                    "content": row["content"],
                    "timestamp": row["timestamp"],
                    "model": row["model"]
                })

            return results


# Singleton instance
_db_instance = None


def get_conversation_db() -> ConversationDB:
    """Get the singleton conversation database instance"""
    global _db_instance
    if _db_instance is None:
        _db_instance = ConversationDB()
    return _db_instance
