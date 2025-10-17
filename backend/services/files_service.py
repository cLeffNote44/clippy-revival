import os
import shutil
from pathlib import Path
from typing import List, Dict, Optional
from send2trash import send2trash
import time

class FilesService:
    def __init__(self):
        self.allowed_base_paths = [
            str(Path.home()),
            str(Path.home() / "Documents"),
            str(Path.home() / "Downloads"),
            str(Path.home() / "Desktop"),
        ]
    
    def _is_path_allowed(self, path: str) -> bool:
        """Check if path is within allowed directories"""
        try:
            resolved_path = str(Path(path).resolve())
            return any(
                resolved_path.startswith(base) 
                for base in self.allowed_base_paths
            )
        except:
            return False
    
    def _sanitize_path(self, path: str) -> Optional[Path]:
        """Sanitize and validate path"""
        try:
            p = Path(path).resolve()
            if self._is_path_allowed(str(p)):
                return p
            return None
        except:
            return None
    
    async def list_files(
        self, 
        path: str = None,
        show_hidden: bool = False
    ) -> Dict:
        """List files in directory"""
        try:
            if path is None:
                path = str(Path.home())
            
            dir_path = self._sanitize_path(path)
            if not dir_path or not dir_path.exists():
                return {"error": "Invalid or restricted path"}
            
            if not dir_path.is_dir():
                return {"error": "Path is not a directory"}
            
            files = []
            dirs = []
            
            for item in dir_path.iterdir():
                # Skip hidden files unless requested
                if not show_hidden and item.name.startswith('.'):
                    continue
                
                try:
                    stat = item.stat()
                    file_info = {
                        "name": item.name,
                        "path": str(item),
                        "size": stat.st_size,
                        "modified": stat.st_mtime,
                        "is_dir": item.is_dir()
                    }
                    
                    if item.is_dir():
                        dirs.append(file_info)
                    else:
                        file_info["extension"] = item.suffix
                        files.append(file_info)
                except:
                    continue
            
            return {
                "path": str(dir_path),
                "directories": sorted(dirs, key=lambda x: x['name'].lower()),
                "files": sorted(files, key=lambda x: x['name'].lower()),
                "total": len(files) + len(dirs)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def move_file(
        self, 
        source: str, 
        destination: str,
        overwrite: bool = False
    ) -> Dict:
        """Move or rename a file"""
        try:
            src = self._sanitize_path(source)
            dst = self._sanitize_path(destination)
            
            if not src or not dst:
                return {"error": "Invalid or restricted path"}
            
            if not src.exists():
                return {"error": "Source file not found"}
            
            if dst.exists() and not overwrite:
                return {"error": "Destination already exists"}
            
            shutil.move(str(src), str(dst))
            
            return {
                "success": True,
                "source": str(src),
                "destination": str(dst)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def copy_file(
        self,
        source: str,
        destination: str,
        overwrite: bool = False
    ) -> Dict:
        """Copy a file"""
        try:
            src = self._sanitize_path(source)
            dst = self._sanitize_path(destination)
            
            if not src or not dst:
                return {"error": "Invalid or restricted path"}
            
            if not src.exists():
                return {"error": "Source file not found"}
            
            if dst.exists() and not overwrite:
                return {"error": "Destination already exists"}
            
            if src.is_dir():
                shutil.copytree(str(src), str(dst))
            else:
                shutil.copy2(str(src), str(dst))
            
            return {
                "success": True,
                "source": str(src),
                "destination": str(dst)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def delete_files(
        self,
        paths: List[str],
        permanent: bool = False
    ) -> Dict:
        """Delete files (to recycle bin by default)"""
        try:
            deleted = []
            failed = []
            
            for path in paths:
                file_path = self._sanitize_path(path)
                
                if not file_path:
                    failed.append({"path": path, "reason": "Invalid path"})
                    continue
                
                if not file_path.exists():
                    failed.append({"path": path, "reason": "File not found"})
                    continue
                
                try:
                    if permanent:
                        if file_path.is_dir():
                            shutil.rmtree(str(file_path))
                        else:
                            file_path.unlink()
                    else:
                        # Send to recycle bin
                        send2trash(str(file_path))
                    
                    deleted.append(str(file_path))
                    
                except Exception as e:
                    failed.append({"path": path, "reason": str(e)})
            
            return {
                "success": True,
                "deleted": deleted,
                "failed": failed,
                "count": len(deleted)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def create_directory(self, path: str) -> Dict:
        """Create a new directory"""
        try:
            dir_path = self._sanitize_path(path)
            
            if not dir_path:
                return {"error": "Invalid or restricted path"}
            
            if dir_path.exists():
                return {"error": "Directory already exists"}
            
            dir_path.mkdir(parents=True, exist_ok=False)
            
            return {
                "success": True,
                "path": str(dir_path)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def get_file_info(self, path: str) -> Dict:
        """Get detailed file information"""
        try:
            file_path = self._sanitize_path(path)
            
            if not file_path or not file_path.exists():
                return {"error": "Invalid path or file not found"}
            
            stat = file_path.stat()
            
            info = {
                "name": file_path.name,
                "path": str(file_path),
                "size": stat.st_size,
                "created": stat.st_ctime,
                "modified": stat.st_mtime,
                "accessed": stat.st_atime,
                "is_dir": file_path.is_dir(),
                "is_file": file_path.is_file(),
            }
            
            if file_path.is_file():
                info["extension"] = file_path.suffix
                info["stem"] = file_path.stem
            
            return info
            
        except Exception as e:
            return {"error": str(e)}
    
    async def search_files(
        self,
        directory: str,
        pattern: str,
        max_results: int = 100
    ) -> Dict:
        """Search for files matching pattern"""
        try:
            dir_path = self._sanitize_path(directory)
            
            if not dir_path or not dir_path.is_dir():
                return {"error": "Invalid directory"}
            
            results = []
            count = 0
            
            for item in dir_path.rglob(pattern):
                if count >= max_results:
                    break
                
                if self._is_path_allowed(str(item)):
                    try:
                        stat = item.stat()
                        results.append({
                            "name": item.name,
                            "path": str(item),
                            "size": stat.st_size,
                            "modified": stat.st_mtime,
                            "is_dir": item.is_dir()
                        })
                        count += 1
                    except:
                        continue
            
            return {
                "results": results,
                "count": len(results),
                "pattern": pattern
            }
            
        except Exception as e:
            return {"error": str(e)}