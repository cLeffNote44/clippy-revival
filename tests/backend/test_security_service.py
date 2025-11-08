"""
Tests for Security Service
Tests path validation, permission checking, and sensitive data handling
"""

import pytest
import os
import tempfile
from pathlib import Path
from backend.services.security_service import SecurityService, PermissionLevel


@pytest.fixture
def security_service():
    """Create a SecurityService instance for testing"""
    return SecurityService()


@pytest.fixture
def temp_test_dir():
    """Create a temporary directory for testing"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


class TestSecurityService:
    """Test suite for SecurityService"""

    def test_initialization(self, security_service):
        """Test service initializes with default safe paths"""
        assert security_service is not None
        assert len(security_service.allowed_paths) > 0
        assert len(security_service.forbidden_paths) > 0

    def test_path_validation_safe_path(self, security_service, temp_test_dir):
        """Test validation of safe paths"""
        # Add temp dir to allowed paths
        security_service.add_allowed_path(str(temp_test_dir))

        test_file = temp_test_dir / "test.txt"
        test_file.write_text("test content")

        result = security_service.validate_path(str(test_file), PermissionLevel.READ)

        assert result["allowed"] is True
        assert result["safe"] is True

    def test_path_validation_forbidden_path(self, security_service):
        """Test validation rejects forbidden paths"""
        # Test common forbidden paths
        forbidden_paths = [
            "C:\\Windows\\System32\\config",
            "C:\\Program Files",
            "/etc/passwd",
            "/System/Library"
        ]

        for path in forbidden_paths:
            result = security_service.validate_path(path, PermissionLevel.READ)
            # Should either be not allowed or not safe
            assert result["allowed"] is False or result["safe"] is False

    def test_path_traversal_attack(self, security_service, temp_test_dir):
        """Test protection against path traversal attacks"""
        security_service.add_allowed_path(str(temp_test_dir))

        # Attempt path traversal
        malicious_path = str(temp_test_dir / ".." / ".." / "etc" / "passwd")

        result = security_service.validate_path(malicious_path, PermissionLevel.READ)

        # Should detect and reject path traversal
        assert result["safe"] is False or result["allowed"] is False

    def test_permission_levels(self, security_service, temp_test_dir):
        """Test different permission levels"""
        security_service.add_allowed_path(str(temp_test_dir))
        test_file = temp_test_dir / "test.txt"

        # Read permission should be granted
        read_result = security_service.validate_path(
            str(test_file),
            PermissionLevel.READ
        )
        assert read_result["allowed"] is True

        # Write permission should be checked more strictly
        write_result = security_service.validate_path(
            str(test_file),
            PermissionLevel.WRITE
        )
        assert "allowed" in write_result

        # Delete permission should be most restrictive
        delete_result = security_service.validate_path(
            str(test_file),
            PermissionLevel.DELETE
        )
        assert "allowed" in delete_result

    def test_sensitive_file_detection(self, security_service):
        """Test detection of sensitive files"""
        sensitive_files = [
            ".env",
            "credentials.json",
            "private_key.pem",
            "id_rsa",
            "password.txt"
        ]

        for filename in sensitive_files:
            is_sensitive = security_service.is_sensitive_file(filename)
            assert is_sensitive is True

    def test_non_sensitive_file_detection(self, security_service):
        """Test normal files are not marked as sensitive"""
        normal_files = [
            "document.txt",
            "image.png",
            "script.py",
            "README.md"
        ]

        for filename in normal_files:
            is_sensitive = security_service.is_sensitive_file(filename)
            assert is_sensitive is False

    def test_add_allowed_path(self, security_service, temp_test_dir):
        """Test adding paths to allowlist"""
        initial_count = len(security_service.allowed_paths)

        security_service.add_allowed_path(str(temp_test_dir))

        assert len(security_service.allowed_paths) > initial_count
        assert str(temp_test_dir) in [
            str(p) for p in security_service.allowed_paths
        ]

    def test_remove_allowed_path(self, security_service, temp_test_dir):
        """Test removing paths from allowlist"""
        security_service.add_allowed_path(str(temp_test_dir))
        assert str(temp_test_dir) in [
            str(p) for p in security_service.allowed_paths
        ]

        security_service.remove_allowed_path(str(temp_test_dir))

        assert str(temp_test_dir) not in [
            str(p) for p in security_service.allowed_paths
        ]

    def test_sanitize_path(self, security_service):
        """Test path sanitization"""
        # Test with relative path
        relative_path = "../../../etc/passwd"
        sanitized = security_service.sanitize_path(relative_path)

        # Should convert to absolute and normalize
        assert isinstance(sanitized, Path)
        assert sanitized.is_absolute() or ".." not in str(sanitized)

    def test_check_permission_read(self, security_service, temp_test_dir):
        """Test checking read permissions"""
        security_service.add_allowed_path(str(temp_test_dir))
        test_file = temp_test_dir / "readable.txt"
        test_file.write_text("content")

        has_permission = security_service.check_permission(
            str(test_file),
            PermissionLevel.READ
        )

        assert has_permission is True

    def test_check_permission_write(self, security_service, temp_test_dir):
        """Test checking write permissions"""
        security_service.add_allowed_path(str(temp_test_dir))
        test_file = temp_test_dir / "writable.txt"

        has_permission = security_service.check_permission(
            str(test_file),
            PermissionLevel.WRITE
        )

        assert isinstance(has_permission, bool)

    def test_check_permission_delete(self, security_service, temp_test_dir):
        """Test checking delete permissions"""
        security_service.add_allowed_path(str(temp_test_dir))
        test_file = temp_test_dir / "deletable.txt"
        test_file.write_text("content")

        has_permission = security_service.check_permission(
            str(test_file),
            PermissionLevel.DELETE
        )

        assert isinstance(has_permission, bool)

    def test_redact_sensitive_data(self, security_service):
        """Test sensitive data redaction in logs"""
        sensitive_text = "Password: mypassword123, API_KEY=secret123"

        redacted = security_service.redact_sensitive_data(sensitive_text)

        assert "mypassword123" not in redacted
        assert "secret123" not in redacted
        assert "***" in redacted or "[REDACTED]" in redacted

    def test_validate_nonexistent_path(self, security_service, temp_test_dir):
        """Test validation of non-existent paths"""
        security_service.add_allowed_path(str(temp_test_dir))
        nonexistent = temp_test_dir / "does_not_exist.txt"

        result = security_service.validate_path(
            str(nonexistent),
            PermissionLevel.READ
        )

        # Should still validate the path even if file doesn't exist
        assert "allowed" in result
        assert "safe" in result

    def test_symlink_handling(self, security_service, temp_test_dir):
        """Test handling of symbolic links"""
        if os.name == 'nt':
            pytest.skip("Symlink test not applicable on Windows")

        security_service.add_allowed_path(str(temp_test_dir))

        # Create a file and a symlink to it
        real_file = temp_test_dir / "real.txt"
        real_file.write_text("content")
        symlink = temp_test_dir / "link.txt"

        try:
            symlink.symlink_to(real_file)

            result = security_service.validate_path(
                str(symlink),
                PermissionLevel.READ
            )

            # Should handle symlinks safely
            assert "allowed" in result
        except OSError:
            pytest.skip("Cannot create symlinks")

    def test_case_insensitive_paths_windows(self, security_service):
        """Test case handling on Windows paths"""
        if os.name != 'nt':
            pytest.skip("Windows-specific test")

        # Windows paths should be case-insensitive
        path1 = "C:\\Users\\Test"
        path2 = "c:\\users\\test"

        sanitized1 = security_service.sanitize_path(path1)
        sanitized2 = security_service.sanitize_path(path2)

        # Both should resolve to same path on Windows
        assert sanitized1 == sanitized2 or str(sanitized1).lower() == str(sanitized2).lower()

    def test_multiple_permission_checks(self, security_service, temp_test_dir):
        """Test multiple rapid permission checks"""
        security_service.add_allowed_path(str(temp_test_dir))
        test_file = temp_test_dir / "test.txt"
        test_file.write_text("content")

        # Perform multiple checks
        for _ in range(10):
            result = security_service.check_permission(
                str(test_file),
                PermissionLevel.READ
            )
            assert isinstance(result, bool)

    def test_forbidden_path_patterns(self, security_service):
        """Test various forbidden path patterns"""
        forbidden_patterns = [
            "C:\\Windows\\System32",
            "/etc",
            "/System",
            "C:\\Program Files\\Windows NT",
            "/var/log",
            "/root"
        ]

        for pattern in forbidden_patterns:
            result = security_service.validate_path(pattern, PermissionLevel.READ)
            # Should be restricted
            assert result["allowed"] is False or result.get("warning") is not None
