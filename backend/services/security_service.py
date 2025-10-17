"""
Security service for path validation, permission checks, and safe operations
"""

import os
import re
from pathlib import Path
from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class SecurityService:
    """Handles security-related operations and validations"""
    
    def __init__(self):
        # Safe base paths (user directories only by default)
        self.allowed_base_paths = [
            Path.home(),
            Path.home() / "Desktop",
            Path.home() / "Documents",
            Path.home() / "Downloads",
            Path.home() / "Pictures",
            Path.home() / "Videos",
            Path.home() / "Music"
        ]
        
        # Forbidden paths
        self.forbidden_paths = [
            Path("C:\\Windows"),
            Path("C:\\Program Files"),
            Path("C:\\Program Files (x86)"),
            Path(os.environ.get("SystemRoot", "C:\\Windows")),
        ]
        
        # Sensitive file patterns to protect
        self.sensitive_patterns = [
            r".*\.key$",
            r".*\.pem$",
            r".*\.pfx$",
            r".*\.p12$",
            r".*password.*",
            r".*secret.*",
            r".*\.ssh.*",
        ]
    
    def validate_path(self, path: str) -> Tuple[bool, Optional[str]]:
        """
        Validate that a path is safe to access
        
        Returns:
            (is_valid, error_message)
        """
        try:
            # Normalize and resolve the path
            resolved_path = Path(path).resolve()
            
            # Check if path exists
            if not resolved_path.exists():
                return False, "Path does not exist"
            
            # Check if path is in forbidden locations
            for forbidden in self.forbidden_paths:
                try:
                    if resolved_path.is_relative_to(forbidden):
                        return False, f"Access to {forbidden} is forbidden"
                except ValueError:
                    pass
            
            # Check if path is within allowed base paths
            is_allowed = False
            for allowed_base in self.allowed_base_paths:
                try:
                    if resolved_path.is_relative_to(allowed_base):
                        is_allowed = True
                        break
                except ValueError:
                    continue
            
            if not is_allowed:
                return False, "Path is outside allowed directories"
            
            return True, None
            
        except Exception as e:
            return False, f"Path validation error: {str(e)}"
    
    def is_sensitive_file(self, path: str) -> bool:
        """Check if file appears to contain sensitive data"""
        path_lower = path.lower()
        
        for pattern in self.sensitive_patterns:
            if re.match(pattern, path_lower):
                return True
        
        return False
    
    def sanitize_path(self, path: str) -> str:
        """Sanitize a path for safe operations"""
        # Remove any path traversal attempts
        path = path.replace("../", "").replace("..\\", "")
        
        # Normalize slashes
        path = path.replace("/", os.sep)
        
        # Remove multiple consecutive separators
        while f"{os.sep}{os.sep}" in path:
            path = path.replace(f"{os.sep}{os.sep}", os.sep)
        
        return path
    
    def check_permissions(self, path: str, operation: str = "read") -> Tuple[bool, Optional[str]]:
        """
        Check if we have permissions for an operation
        
        Args:
            path: Path to check
            operation: 'read', 'write', 'delete'
        
        Returns:
            (has_permission, error_message)
        """
        try:
            resolved_path = Path(path).resolve()
            
            if operation == "read":
                if not os.access(resolved_path, os.R_OK):
                    return False, "No read permission"
            
            elif operation == "write":
                if resolved_path.exists() and not os.access(resolved_path, os.W_OK):
                    return False, "No write permission"
                elif not resolved_path.exists():
                    # Check parent directory
                    parent = resolved_path.parent
                    if not os.access(parent, os.W_OK):
                        return False, "No write permission in parent directory"
            
            elif operation == "delete":
                if not os.access(resolved_path, os.W_OK):
                    return False, "No delete permission"
            
            return True, None
            
        except Exception as e:
            return False, f"Permission check error: {str(e)}"
    
    def redact_sensitive_data(self, text: str) -> str:
        """Redact potentially sensitive data from text (for logging)"""
        
        # Redact file paths
        text = re.sub(r'[A-Za-z]:\\[\\\/\w\s\-\.]+', '[PATH_REDACTED]', text)
        
        # Redact what looks like API keys or tokens
        text = re.sub(r'[a-zA-Z0-9_-]{32,}', '[TOKEN_REDACTED]', text)
        
        # Redact email addresses
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL_REDACTED]', text)
        
        # Redact IP addresses
        text = re.sub(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', '[IP_REDACTED]', text)
        
        return text
    
    def validate_file_operation(
        self, 
        paths: List[str], 
        operation: str,
        require_confirmation: bool = True
    ) -> Tuple[bool, Optional[str], List[str]]:
        """
        Validate a file operation before execution
        
        Returns:
            (is_valid, error_message, validated_paths)
        """
        validated_paths = []
        
        for path in paths:
            # Sanitize path
            clean_path = self.sanitize_path(path)
            
            # Validate path access
            is_valid, error = self.validate_path(clean_path)
            if not is_valid:
                return False, f"Path validation failed for {path}: {error}", []
            
            # Check permissions
            has_perm, error = self.check_permissions(clean_path, operation)
            if not has_perm:
                return False, f"Permission denied for {path}: {error}", []
            
            # Warn about sensitive files
            if self.is_sensitive_file(clean_path):
                logger.warning(f"Operation on potentially sensitive file: {clean_path}")
                if require_confirmation:
                    # This should trigger a confirmation dialog in the UI
                    pass
            
            validated_paths.append(clean_path)
        
        return True, None, validated_paths
    
    def add_allowed_path(self, path: str) -> Tuple[bool, Optional[str]]:
        """Add a path to the allowed list (requires user confirmation in UI)"""
        try:
            resolved_path = Path(path).resolve()
            
            if not resolved_path.exists():
                return False, "Path does not exist"
            
            if resolved_path not in self.allowed_base_paths:
                self.allowed_base_paths.append(resolved_path)
                logger.info(f"Added allowed path: {resolved_path}")
            
            return True, None
            
        except Exception as e:
            return False, f"Failed to add path: {str(e)}"


# Singleton instance
_security_service = SecurityService()

def get_security_service() -> SecurityService:
    """Get the singleton security service instance"""
    return _security_service
