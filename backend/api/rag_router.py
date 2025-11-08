"""
RAG (Retrieval Augmented Generation) API Router
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from services.rag_service import RAGService
import tempfile
import shutil
from pathlib import Path

router = APIRouter()
rag_service = RAGService()


class AddDocumentRequest(BaseModel):
    file_path: str
    document_name: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5


class RemoveDocumentRequest(BaseModel):
    document_id: str


@router.post("/documents/add")
async def add_document(request: AddDocumentRequest):
    """
    Add a document to the RAG system

    Supports: PDF, DOCX, TXT, MD, JSON, CSV, and code files
    """
    result = rag_service.add_document(request.file_path, request.document_name)

    if result["success"]:
        return result
    else:
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to add document"))


@router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...), document_name: Optional[str] = None):
    """
    Upload and add a document to the RAG system

    This endpoint accepts file uploads via multipart/form-data
    """
    try:
        # Create temporary file
        suffix = Path(file.filename).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        # Add document
        name = document_name or file.filename
        result = rag_service.add_document(tmp_path, name)

        # Clean up temp file
        Path(tmp_path).unlink()

        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to add document"))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents/{document_id}")
async def remove_document(document_id: str):
    """Remove a document from the RAG system"""
    success = rag_service.remove_document(document_id)

    if success:
        return {"success": True, "document_id": document_id}
    else:
        raise HTTPException(status_code=404, detail="Document not found")


@router.get("/documents")
async def list_documents():
    """List all documents in the RAG system"""
    documents = rag_service.list_documents()
    return {"documents": documents}


@router.post("/search")
async def search(request: SearchRequest):
    """
    Search for relevant document chunks

    Returns the most relevant chunks based on semantic similarity
    """
    results = rag_service.search(request.query, request.top_k)
    return {"results": results, "count": len(results)}


@router.post("/context")
async def get_context(request: SearchRequest):
    """
    Get formatted context for an AI query

    Returns a formatted string ready to be included in AI prompts
    """
    context = rag_service.get_context_for_query(request.query, max_chunks=request.top_k)
    return {
        "context": context,
        "has_context": bool(context)
    }


@router.get("/stats")
async def get_stats():
    """Get RAG system statistics"""
    stats = rag_service.get_stats()
    return stats


@router.post("/clear")
async def clear_all():
    """
    Clear all documents from the RAG system

    WARNING: This removes all indexed documents and embeddings
    """
    try:
        # Remove all documents
        documents = rag_service.list_documents()
        for doc in documents:
            rag_service.remove_document(doc["id"])

        return {
            "success": True,
            "removed_count": len(documents)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
