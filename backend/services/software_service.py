import subprocess
import asyncio
from typing import List, Dict, Optional
import json
import re

class SoftwareService:
    def __init__(self):
        self.has_winget = self._check_winget()
    
    def _check_winget(self) -> bool:
        """Check if winget is available"""
        try:
            result = subprocess.run(
                ["winget", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except:
            return False
    
    async def search_software(self, query: str, max_results: int = 20) -> Dict:
        """Search for software packages"""
        if not self.has_winget:
            return {"error": "winget is not available"}
        
        try:
            process = await asyncio.create_subprocess_exec(
                "winget", "search", query, "--accept-source-agreements",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                return {"error": stderr.decode()}
            
            output = stdout.decode()
            results = self._parse_search_results(output, max_results)
            
            return {
                "query": query,
                "results": results,
                "count": len(results)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def _parse_search_results(self, output: str, max_results: int) -> List[Dict]:
        """Parse winget search output"""
        results = []
        lines = output.split('\n')
        
        # Find the separator line (dashes)
        separator_index = -1
        for i, line in enumerate(lines):
            if '---' in line:
                separator_index = i
                break
        
        if separator_index == -1:
            return results
        
        # Parse results after separator
        for line in lines[separator_index + 1:]:
            if not line.strip() or len(results) >= max_results:
                break
            
            # Split by multiple spaces
            parts = re.split(r'\s{2,}', line.strip())
            
            if len(parts) >= 2:
                results.append({
                    "name": parts[0],
                    "id": parts[1] if len(parts) > 1 else parts[0],
                    "version": parts[2] if len(parts) > 2 else "Unknown",
                    "source": parts[3] if len(parts) > 3 else "winget"
                })
        
        return results
    
    async def get_installed_software(self) -> Dict:
        """List installed software"""
        if not self.has_winget:
            return {"error": "winget is not available"}
        
        try:
            process = await asyncio.create_subprocess_exec(
                "winget", "list",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                return {"error": stderr.decode()}
            
            output = stdout.decode()
            installed = self._parse_installed_list(output)
            
            return {
                "installed": installed,
                "count": len(installed)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def _parse_installed_list(self, output: str) -> List[Dict]:
        """Parse winget list output"""
        results = []
        lines = output.split('\n')
        
        separator_index = -1
        for i, line in enumerate(lines):
            if '---' in line:
                separator_index = i
                break
        
        if separator_index == -1:
            return results
        
        for line in lines[separator_index + 1:]:
            if not line.strip():
                continue
            
            parts = re.split(r'\s{2,}', line.strip())
            
            if len(parts) >= 2:
                results.append({
                    "name": parts[0],
                    "id": parts[1] if len(parts) > 1 else parts[0],
                    "version": parts[2] if len(parts) > 2 else "Unknown",
                    "available": parts[3] if len(parts) > 3 else None,
                    "source": parts[4] if len(parts) > 4 else "Unknown"
                })
        
        return results
    
    async def install_software(
        self,
        package_id: str,
        silent: bool = True,
        accept_agreements: bool = True
    ) -> Dict:
        """Install software package"""
        if not self.has_winget:
            return {"error": "winget is not available"}
        
        try:
            cmd = ["winget", "install", package_id]
            
            if silent:
                cmd.append("--silent")
            
            if accept_agreements:
                cmd.extend(["--accept-package-agreements", "--accept-source-agreements"])
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            success = process.returncode == 0
            
            return {
                "success": success,
                "package_id": package_id,
                "output": stdout.decode() if success else stderr.decode(),
                "returncode": process.returncode
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def uninstall_software(
        self,
        package_id: str,
        silent: bool = True
    ) -> Dict:
        """Uninstall software package"""
        if not self.has_winget:
            return {"error": "winget is not available"}
        
        try:
            cmd = ["winget", "uninstall", package_id]
            
            if silent:
                cmd.append("--silent")
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            success = process.returncode == 0
            
            return {
                "success": success,
                "package_id": package_id,
                "output": stdout.decode() if success else stderr.decode(),
                "returncode": process.returncode
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def upgrade_software(
        self,
        package_id: Optional[str] = None,
        upgrade_all: bool = False
    ) -> Dict:
        """Upgrade software package(s)"""
        if not self.has_winget:
            return {"error": "winget is not available"}
        
        try:
            cmd = ["winget", "upgrade"]
            
            if upgrade_all:
                cmd.append("--all")
            elif package_id:
                cmd.append(package_id)
            else:
                return {"error": "Must specify package_id or set upgrade_all=True"}
            
            cmd.extend(["--silent", "--accept-package-agreements", "--accept-source-agreements"])
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            success = process.returncode == 0
            
            return {
                "success": success,
                "output": stdout.decode() if success else stderr.decode(),
                "returncode": process.returncode
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def get_package_info(self, package_id: str) -> Dict:
        """Get detailed information about a package"""
        if not self.has_winget:
            return {"error": "winget is not available"}
        
        try:
            process = await asyncio.create_subprocess_exec(
                "winget", "show", package_id,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                return {"error": stderr.decode()}
            
            output = stdout.decode()
            info = self._parse_package_info(output)
            
            return info
            
        except Exception as e:
            return {"error": str(e)}
    
    def _parse_package_info(self, output: str) -> Dict:
        """Parse package info output"""
        info = {}
        
        for line in output.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip().lower().replace(' ', '_')
                value = value.strip()
                
                if key and value:
                    info[key] = value
        
        return info