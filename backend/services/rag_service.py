"""
RAG (Retrieval Augmented Generation) Service
Enables AI to access and reference local documents for enhanced responses
"""

import os
import json
import hashlib
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import re
from datetime import datetime

# Document parsing libraries (conditional imports)
try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    from docx import Document as DocxDocument
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

# Vector embeddings (using sentence-transformers for local embeddings)
try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    EMBEDDINGS_AVAILABLE = True
except ImportError:
    EMBEDDINGS_AVAILABLE = False

from services.logger import get_logger

logger = get_logger("rag")


class RAGService:
    """
    Retrieval Augmented Generation Service

    Features:
    - Document ingestion (PDF, TXT, DOCX, MD, etc.)
    - Text chunking with overlap
    - Local embeddings using sentence-transformers
    - Vector similarity search
    - Context retrieval for AI queries
    - Document management (add, remove, list)
    """

    def __init__(self, documents_dir: str = "data/documents", embeddings_dir: str = "data/embeddings"):
        self.documents_dir = Path(documents_dir)
        self.embeddings_dir = Path(embeddings_dir)

        # Create directories
        self.documents_dir.mkdir(parents=True, exist_ok=True)
        self.embeddings_dir.mkdir(parents=True, exist_ok=True)

        # Metadata and vector storage
        self.metadata_file = self.embeddings_dir / "metadata.json"
        self.vectors_file = self.embeddings_dir / "vectors.npy"

        # Load or initialize metadata
        self.metadata = self._load_metadata()

        # Initialize embedding model (local, no API required)
        self.embedding_model = None
        if EMBEDDINGS_AVAILABLE:
            try:
                # Using all-MiniLM-L6-v2: fast, 384 dimensions, good quality
                self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("Embedding model loaded: all-MiniLM-L6-v2")
            except Exception as e:
                logger.warning(f"Failed to load embedding model: {e}")
                logger.info("RAG will work with keyword search fallback")
        else:
            logger.warning("sentence-transformers not installed. Install: pip install sentence-transformers")
            logger.info("RAG will use keyword search fallback")

        # Chunk settings
        self.chunk_size = 512  # characters per chunk
        self.chunk_overlap = 128  # overlap between chunks

    def _load_metadata(self) -> Dict:
        """Load document metadata from disk"""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading metadata: {e}")
                return {"documents": [], "chunks": []}
        return {"documents": [], "chunks": []}

    def _save_metadata(self):
        """Save document metadata to disk"""
        try:
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump(self.metadata, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving metadata: {e}")

    def _compute_file_hash(self, file_path: Path) -> str:
        """Compute SHA256 hash of file"""
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                sha256.update(chunk)
        return sha256.hexdigest()

    def _extract_text_from_file(self, file_path: Path) -> Optional[str]:
        """Extract text from various file formats"""
        extension = file_path.suffix.lower()

        try:
            # Plain text files
            if extension in ['.txt', '.md', '.json', '.csv', '.log', '.py', '.js', '.html', '.css']:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()

            # PDF files
            elif extension == '.pdf' and PDF_AVAILABLE:
                with open(file_path, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    text = ""
                    for page in reader.pages:
                        text += page.extract_text() + "\n"
                    return text

            # Word documents
            elif extension == '.docx' and DOCX_AVAILABLE:
                doc = DocxDocument(file_path)
                text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
                return text

            else:
                logger.warning(f"Unsupported file type: {extension}")
                return None

        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {e}")
            return None

    def _chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks"""
        if not text:
            return []

        chunks = []
        start = 0
        text_length = len(text)

        while start < text_length:
            end = start + self.chunk_size

            # Try to break at sentence or paragraph boundary
            if end < text_length:
                # Look for sentence endings
                for delimiter in ['\n\n', '\n', '. ', '! ', '? ']:
                    pos = text.rfind(delimiter, start, end)
                    if pos != -1:
                        end = pos + len(delimiter)
                        break

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            start = end - self.chunk_overlap

            # Prevent infinite loop
            if start >= text_length:
                break

        return chunks

    def _compute_embeddings(self, texts: List[str]) -> Optional[np.ndarray]:
        """Compute embeddings for text chunks"""
        if not self.embedding_model or not texts:
            return None

        try:
            embeddings = self.embedding_model.encode(texts, show_progress_bar=False)
            return embeddings
        except Exception as e:
            logger.error(f"Error computing embeddings: {e}")
            return None

    def _keyword_search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Fallback keyword-based search when embeddings unavailable"""
        query_terms = set(re.findall(r'\w+', query.lower()))
        results = []

        for chunk in self.metadata.get("chunks", []):
            chunk_terms = set(re.findall(r'\w+', chunk["text"].lower()))
            overlap = len(query_terms & chunk_terms)

            if overlap > 0:
                results.append({
                    "chunk": chunk,
                    "score": overlap / len(query_terms)
                })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def add_document(self, file_path: str, document_name: Optional[str] = None) -> Dict:
        """
        Add a document to the RAG system

        Returns:
            Dict with success status, document_id, and chunk count
        """
        try:
            file_path = Path(file_path)

            if not file_path.exists():
                return {"success": False, "error": "File not found"}

            # Compute file hash to detect duplicates
            file_hash = self._compute_file_hash(file_path)

            # Check if already indexed
            for doc in self.metadata.get("documents", []):
                if doc["hash"] == file_hash:
                    return {
                        "success": False,
                        "error": "Document already indexed",
                        "document_id": doc["id"]
                    }

            # Extract text
            text = self._extract_text_from_file(file_path)
            if not text:
                return {"success": False, "error": "Could not extract text from file"}

            # Create document record
            doc_id = f"doc_{len(self.metadata.get('documents', []))}"
            document = {
                "id": doc_id,
                "name": document_name or file_path.name,
                "path": str(file_path),
                "hash": file_hash,
                "size": file_path.stat().st_size,
                "added_at": datetime.now().isoformat(),
                "extension": file_path.suffix
            }

            # Chunk text
            chunks = self._chunk_text(text)
            logger.info(f"Created {len(chunks)} chunks from {file_path.name}")

            # Compute embeddings
            embeddings = None
            if self.embedding_model:
                embeddings = self._compute_embeddings(chunks)

            # Store chunks
            chunk_start_id = len(self.metadata.get("chunks", []))
            for i, chunk_text in enumerate(chunks):
                chunk = {
                    "id": f"chunk_{chunk_start_id + i}",
                    "document_id": doc_id,
                    "text": chunk_text,
                    "position": i
                }
                self.metadata.setdefault("chunks", []).append(chunk)

            # Store embeddings
            if embeddings is not None:
                if self.vectors_file.exists():
                    existing_vectors = np.load(self.vectors_file)
                    all_vectors = np.vstack([existing_vectors, embeddings])
                else:
                    all_vectors = embeddings
                np.save(self.vectors_file, all_vectors)

            # Add document to metadata
            self.metadata.setdefault("documents", []).append(document)
            self._save_metadata()

            logger.info(f"Document added: {document['name']} ({len(chunks)} chunks)")

            return {
                "success": True,
                "document_id": doc_id,
                "chunk_count": len(chunks),
                "has_embeddings": embeddings is not None
            }

        except Exception as e:
            logger.error(f"Error adding document: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def remove_document(self, document_id: str) -> bool:
        """Remove a document and its chunks from the RAG system"""
        try:
            # Find document
            doc_index = None
            for i, doc in enumerate(self.metadata.get("documents", [])):
                if doc["id"] == document_id:
                    doc_index = i
                    break

            if doc_index is None:
                return False

            # Remove chunks
            self.metadata["chunks"] = [
                chunk for chunk in self.metadata.get("chunks", [])
                if chunk["document_id"] != document_id
            ]

            # Remove document
            self.metadata["documents"].pop(doc_index)

            # Rebuild embeddings (expensive, but ensures consistency)
            if self.embedding_model:
                all_texts = [chunk["text"] for chunk in self.metadata.get("chunks", [])]
                if all_texts:
                    embeddings = self._compute_embeddings(all_texts)
                    if embeddings is not None:
                        np.save(self.vectors_file, embeddings)
                else:
                    # No chunks left, remove vectors file
                    if self.vectors_file.exists():
                        self.vectors_file.unlink()

            self._save_metadata()
            logger.info(f"Document removed: {document_id}")
            return True

        except Exception as e:
            logger.error(f"Error removing document: {e}")
            return False

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Search for relevant document chunks

        Returns:
            List of dicts with chunk text, document info, and relevance score
        """
        try:
            # Use embedding-based search if available
            if self.embedding_model and self.vectors_file.exists():
                query_embedding = self.embedding_model.encode([query])[0]
                vectors = np.load(self.vectors_file)

                # Compute cosine similarity
                similarities = np.dot(vectors, query_embedding) / (
                    np.linalg.norm(vectors, axis=1) * np.linalg.norm(query_embedding)
                )

                # Get top k indices
                top_indices = np.argsort(similarities)[-top_k:][::-1]

                results = []
                for idx in top_indices:
                    if idx < len(self.metadata.get("chunks", [])):
                        chunk = self.metadata["chunks"][idx]
                        doc = next((d for d in self.metadata.get("documents", [])
                                   if d["id"] == chunk["document_id"]), None)

                        results.append({
                            "text": chunk["text"],
                            "document_name": doc["name"] if doc else "Unknown",
                            "document_id": chunk["document_id"],
                            "chunk_position": chunk["position"],
                            "relevance_score": float(similarities[idx])
                        })

                return results

            else:
                # Fallback to keyword search
                keyword_results = self._keyword_search(query, top_k)
                return [{
                    "text": r["chunk"]["text"],
                    "document_name": next((d["name"] for d in self.metadata.get("documents", [])
                                          if d["id"] == r["chunk"]["document_id"]), "Unknown"),
                    "document_id": r["chunk"]["document_id"],
                    "chunk_position": r["chunk"]["position"],
                    "relevance_score": r["score"],
                    "search_method": "keyword"
                } for r in keyword_results]

        except Exception as e:
            logger.error(f"Error searching: {e}", exc_info=True)
            return []

    def get_context_for_query(self, query: str, max_chunks: int = 3) -> str:
        """
        Get relevant context from documents for an AI query

        Returns formatted context string to include in AI prompt
        """
        results = self.search(query, top_k=max_chunks)

        if not results:
            return ""

        context_parts = ["# Relevant Information from Your Documents:"]

        for i, result in enumerate(results, 1):
            context_parts.append(f"\n## Source {i}: {result['document_name']}")
            context_parts.append(result["text"])
            context_parts.append(f"(Relevance: {result['relevance_score']:.2f})")

        return "\n\n".join(context_parts)

    def list_documents(self) -> List[Dict]:
        """List all indexed documents"""
        return self.metadata.get("documents", [])

    def get_stats(self) -> Dict:
        """Get RAG system statistics"""
        return {
            "document_count": len(self.metadata.get("documents", [])),
            "chunk_count": len(self.metadata.get("chunks", [])),
            "embeddings_enabled": self.embedding_model is not None,
            "supported_formats": [".txt", ".md", ".pdf" if PDF_AVAILABLE else None,
                                 ".docx" if DOCX_AVAILABLE else None, ".json", ".csv",
                                 ".py", ".js", ".html"],
            "embedding_model": "all-MiniLM-L6-v2" if self.embedding_model else None
        }
