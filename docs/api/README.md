# API Reference

Complete REST API documentation for Clippy Revival backend.

**Base URL**: `http://127.0.0.1:43110`

**Interactive Docs**: Visit `http://127.0.0.1:43110/docs` when the backend is running for Swagger UI.

---

## Table of Contents

1. [AI & Chat](#ai--chat)
2. [RAG (Document Search)](#rag-document-search)
3. [System](#system)
4. [Files](#files)
5. [Software](#software)
6. [Web Automation](#web-automation)
7. [Characters](#characters)
8. [Scheduler](#scheduler)
9. [Plugins](#plugins)
10. [Shortcuts](#shortcuts)
11. [Clipboard](#clipboard)
12. [Conversations](#conversations)
13. [Workflows](#workflows)
14. [Voice](#voice)
15. [Context](#context)
16. [Health](#health)

---

## AI & Chat

### List Providers
```http
GET /ai/providers
```

Returns available AI providers (Ollama, Anthropic, OpenAI) and their status.

**Response:**
```json
{
  "providers": [
    {
      "name": "ollama",
      "display_name": "Ollama (Local)",
      "available": true,
      "requires_api_key": false
    }
  ],
  "active_provider": "ollama",
  "active_model": "llama3.2"
}
```

### List Models
```http
GET /ai/models?provider=ollama
```

Returns available models for a provider.

**Response:**
```json
{
  "models": [
    {
      "id": "llama3.2",
      "name": "llama3.2",
      "provider": "ollama"
    }
  ]
}
```

### Set Provider
```http
POST /ai/provider
Content-Type: application/json

{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022"
}
```

### Chat
```http
POST /ai/chat
Content-Type: application/json

{
  "message": "Hello, how can you help me?",
  "session_id": "default",
  "tools_allowed": true
}
```

**Response:**
```json
{
  "role": "assistant",
  "content": "I can help you with...",
  "tool_call": null,
  "session_id": "default",
  "provider": "ollama",
  "model": "llama3.2"
}
```

---

## RAG (Document Search)

### Add Document
```http
POST /rag/documents/add
Content-Type: application/json

{
  "file_path": "/path/to/document.pdf",
  "document_name": "My Document"
}
```

**Response:**
```json
{
  "success": true,
  "document_id": "doc_0",
  "chunk_count": 15,
  "has_embeddings": true
}
```

### Upload Document
```http
POST /rag/documents/upload
Content-Type: multipart/form-data

file: <file>
document_name: "My Document"
```

### List Documents
```http
GET /rag/documents
```

### Search Documents
```http
POST /rag/search
Content-Type: application/json

{
  "query": "What is the main topic?",
  "top_k": 5
}
```

**Response:**
```json
{
  "results": [
    {
      "text": "The main topic is...",
      "document_name": "My Document",
      "document_id": "doc_0",
      "relevance_score": 0.85
    }
  ],
  "count": 1
}
```

### Get Context
```http
POST /rag/context
Content-Type: application/json

{
  "query": "Explain the architecture",
  "top_k": 3
}
```

Returns formatted context ready for AI prompts.

---

## System

### Get System Metrics
```http
GET /system/metrics
```

**Response:**
```json
{
  "cpu": {
    "percent": 45.2,
    "cores": 8
  },
  "memory": {
    "percent": 62.5,
    "used_gb": 10.0,
    "total_gb": 16.0
  },
  "disk": {
    "percent": 55.3,
    "used_gb": 256.0,
    "total_gb": 512.0
  }
}
```

### Cleanup Old Data
```http
POST /system/cleanup
Content-Type: application/json

{
  "days": 30
}
```

---

## Health

### Basic Health Check
```http
GET /health
```

### Detailed Health
```http
GET /health/detailed
```

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "ollama": true,
    "database": true,
    "filesystem": true
  },
  "resources": {
    "cpu_percent": 45.2,
    "memory_percent": 62.5
  }
}
```

### Prometheus Metrics
```http
GET /health/metrics/prometheus
```

Returns metrics in Prometheus format.

---

## Conversations

### List Conversations
```http
GET /conversations/
```

### Get Conversation
```http
GET /conversations/{session_id}
```

### Search Messages
```http
GET /conversations/search?query=hello&limit=10
```

### Get Statistics
```http
GET /conversations/stats/{session_id}
```

### Export Conversation
```http
GET /conversations/export/{session_id}?format=json
```

Formats: `json`, `txt`, `md`

---

## Plugins

### List Plugins
```http
GET /plugins/
```

### Get Plugin
```http
GET /plugins/{plugin_id}
```

### Enable/Disable Plugin
```http
POST /plugins/{plugin_id}/enable
POST /plugins/{plugin_id}/disable
```

### Execute Plugin Action
```http
POST /plugins/{plugin_id}/execute
Content-Type: application/json

{
  "action": "action_name",
  "params": {}
}
```

---

## Shortcuts

### List Shortcuts
```http
GET /shortcuts/
```

### Create Shortcut
```http
POST /shortcuts/
Content-Type: application/json

{
  "name": "My Shortcut",
  "keys": "ctrl+shift+m",
  "action": "open_dashboard",
  "global": false
}
```

### Validate Shortcut
```http
POST /shortcuts/validate
Content-Type: application/json

{
  "keys": "ctrl+shift+m"
}
```

---

## Workflows

### List Workflows
```http
GET /workflows/
```

### Create Workflow
```http
POST /workflows/
Content-Type: application/json

{
  "name": "Auto Backup",
  "trigger": {
    "type": "schedule",
    "cron": "0 2 * * *"
  },
  "actions": [
    {
      "type": "file_backup",
      "path": "/documents"
    }
  ]
}
```

### Execute Workflow
```http
POST /workflows/{workflow_id}/execute
```

---

## Voice

### Get Status
```http
GET /voice/status
```

### List Voices
```http
GET /voice/voices
```

### Text-to-Speech
```http
POST /voice/text-to-speech
Content-Type: application/json

{
  "text": "Hello world",
  "voice": "default"
}
```

---

## WebSocket

### Connect
```
ws://127.0.0.1:43110/ws
```

### Events

**System Metrics:**
```json
{
  "type": "system.metrics",
  "data": {
    "cpu": 45.2,
    "memory": 62.5
  }
}
```

**AI Response:**
```json
{
  "type": "ai.response",
  "data": {
    "content": "Response text",
    "session_id": "default"
  }
}
```

---

## Authentication

Currently, the API does not require authentication. For production deployments, implement:

- API keys
- OAuth 2.0
- JWT tokens

---

## Rate Limiting

No rate limiting is currently enforced. For production:

- Recommended: 100 requests/minute per client
- Implement using middleware

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Examples

### Complete Workflow

```python
import requests

base_url = "http://127.0.0.1:43110"

# 1. Add a document
response = requests.post(f"{base_url}/rag/documents/add", json={
    "file_path": "/path/to/doc.pdf",
    "document_name": "Project Docs"
})
doc_id = response.json()["document_id"]

# 2. Search the document
response = requests.post(f"{base_url}/rag/search", json={
    "query": "What is the project about?",
    "top_k": 3
})
results = response.json()["results"]

# 3. Get context for AI
response = requests.post(f"{base_url}/rag/context", json={
    "query": "Explain the architecture"
})
context = response.json()["context"]

# 4. Chat with context
response = requests.post(f"{base_url}/ai/chat", json={
    "message": f"{context}\n\nExplain the architecture.",
    "session_id": "my-session"
})
print(response.json()["content"])
```

---

For more examples and detailed documentation, visit the [Interactive API Docs](http://127.0.0.1:43110/docs) when running the backend.
