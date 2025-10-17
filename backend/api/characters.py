from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import tempfile
import os
from pathlib import Path

from backend.services.character_service import get_character_service

router = APIRouter(prefix="/characters", tags=["characters"])

class CharacterInfo(BaseModel):
    id: str
    name: str
    author: Optional[str] = None
    version: str
    description: Optional[str] = None
    path: str
    thumbnail: Optional[str] = None

class CharacterManifest(BaseModel):
    id: str
    name: str
    author: Optional[str] = None
    version: str
    description: Optional[str] = None
    display: dict
    animations: dict
    sounds: Optional[dict] = None
    basePath: Optional[str] = None

@router.get("/list", response_model=List[CharacterInfo])
async def list_character_packs():
    """List all installed character packs"""
    try:
        service = get_character_service()
        packs = service.list_packs()
        return packs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list packs: {str(e)}")

@router.get("/{pack_id}", response_model=CharacterManifest)
async def get_character_pack(pack_id: str):
    """Get full manifest for a specific character pack"""
    try:
        service = get_character_service()
        pack = service.get_pack(pack_id)
        
        if not pack:
            raise HTTPException(status_code=404, detail="Character pack not found")
        
        return pack
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load pack: {str(e)}")

@router.post("/import")
async def import_character_pack(file: UploadFile = File(...)):
    """
    Import a character pack from an uploaded zip file
    
    Validates the manifest and extracts the pack to the characters directory
    """
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only .zip files are supported")
    
    try:
        # Save uploaded file to temp location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        # Import the pack
        service = get_character_service()
        success, error, pack_id = service.import_pack(tmp_path)
        
        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except:
            pass
        
        if not success:
            raise HTTPException(status_code=400, detail=error)
        
        return {
            "success": True,
            "pack_id": pack_id,
            "message": f"Successfully imported character pack: {pack_id}"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@router.delete("/{pack_id}")
async def delete_character_pack(pack_id: str):
    """Delete a character pack"""
    try:
        service = get_character_service()
        success, error = service.delete_pack(pack_id)
        
        if not success:
            raise HTTPException(status_code=400, detail=error)
        
        return {
            "success": True,
            "message": f"Successfully deleted character pack: {pack_id}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete pack: {str(e)}")

@router.post("/validate")
async def validate_character_manifest(manifest: dict):
    """Validate a character manifest against the schema"""
    try:
        service = get_character_service()
        valid, error = service.validate_manifest(manifest)
        
        if not valid:
            return {
                "valid": False,
                "error": error
            }
        
        return {
            "valid": True,
            "message": "Manifest is valid"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")
