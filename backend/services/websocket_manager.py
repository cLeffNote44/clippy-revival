from fastapi import WebSocket
from typing import List, Dict, Set
import json

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscriptions: Dict[WebSocket, Set[str]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.subscriptions[websocket] = set()

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.subscriptions:
            del self.subscriptions[websocket]

    def subscribe(self, websocket: WebSocket, event_types: List[str]):
        if websocket in self.subscriptions:
            self.subscriptions[websocket].update(event_types)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict, event_type: str = None):
        for connection in self.active_connections:
            if event_type is None or event_type in self.subscriptions.get(connection, set()):
                try:
                    await connection.send_json(message)
                except:
                    # Connection might be closed
                    pass

    async def disconnect_all(self):
        for connection in self.active_connections:
            try:
                await connection.close()
            except:
                pass
        self.active_connections.clear()
        self.subscriptions.clear()