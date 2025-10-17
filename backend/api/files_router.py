from fastapi import APIRouter
from pydantic import BaseModel
from services.files_service import FilesService
from typing import List, Optional

router = APIRouter()
files_service = FilesService()

class MoveFileRequest(BaseModel):
    source: str
    destination: str
    overwrite: bool = False

class CopyFileRequest(BaseModel):
    source: str
    destination: str
    overwrite: bool = False

class DeleteFilesRequest(BaseModel):
    paths: List[str]
    permanent: bool = False

class CreateDirRequest(BaseModel):
    path: str

class SearchRequest(BaseModel):
    directory: str
    pattern: str
    max_results: int = 100

@router.get("/list")
async def list_files(path: Optional[str] = None, show_hidden: bool = False):
    """List files in directory"""
    return await files_service.list_files(path, show_hidden)

@router.post("/move")
async def move_file(request: MoveFileRequest):
    """Move or rename a file"""
    return await files_service.move_file(
        request.source,
        request.destination,
        request.overwrite
    )

@router.post("/copy")
async def copy_file(request: CopyFileRequest):
    """Copy a file or directory"""
    return await files_service.copy_file(
        request.source,
        request.destination,
        request.overwrite
    )

@router.post("/delete")
async def delete_files(request: DeleteFilesRequest):
    """Delete files (to recycle bin by default)"""
    return await files_service.delete_files(
        request.paths,
        request.permanent
    )

@router.post("/mkdir")
async def create_directory(request: CreateDirRequest):
    """Create a new directory"""
    return await files_service.create_directory(request.path)

@router.get("/info")
async def get_file_info(path: str):
    """Get detailed file information"""
    return await files_service.get_file_info(path)

@router.post("/search")
async def search_files(request: SearchRequest):
    """Search for files matching pattern"""
    return await files_service.search_files(
        request.directory,
        request.pattern,
        request.max_results
    )
