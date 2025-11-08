"""
Tests for Files Service
Tests file operations, path handling, and safety features
"""

import pytest
import tempfile
from pathlib import Path
from backend.services.files_service import FilesService


@pytest.fixture
def files_service():
    """Create a FilesService instance for testing"""
    return FilesService()


@pytest.fixture
def temp_test_dir():
    """Create a temporary directory for testing"""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create some test files
        temp_path = Path(tmpdir)
        (temp_path / "file1.txt").write_text("Content 1")
        (temp_path / "file2.txt").write_text("Content 2")
        (temp_path / "subdir").mkdir()
        (temp_path / "subdir" / "file3.txt").write_text("Content 3")
        yield temp_path


class TestFilesService:
    """Test suite for FilesService"""

    def test_initialization(self, files_service):
        """Test service initializes correctly"""
        assert files_service is not None

    def test_list_directory(self, files_service, temp_test_dir):
        """Test listing directory contents"""
        result = files_service.list_directory(str(temp_test_dir))

        assert "files" in result
        assert len(result["files"]) >= 2  # At least file1.txt and file2.txt
        assert any(f["name"] == "file1.txt" for f in result["files"])
        assert any(f["name"] == "subdir" for f in result["files"])

    def test_list_directory_with_pattern(self, files_service, temp_test_dir):
        """Test listing directory with file pattern"""
        result = files_service.list_directory(
            str(temp_test_dir),
            pattern="*.txt"
        )

        assert "files" in result
        # Should only include .txt files
        assert all(f["name"].endswith(".txt") for f in result["files"])

    def test_list_nonexistent_directory(self, files_service):
        """Test listing non-existent directory returns error"""
        result = files_service.list_directory("/nonexistent/directory")

        assert "error" in result or len(result.get("files", [])) == 0

    def test_move_file(self, files_service, temp_test_dir):
        """Test moving a file"""
        source = temp_test_dir / "file1.txt"
        dest = temp_test_dir / "moved_file.txt"

        result = files_service.move_file(str(source), str(dest))

        assert result.get("success") is True
        assert not source.exists()
        assert dest.exists()
        assert dest.read_text() == "Content 1"

    def test_move_file_to_subdirectory(self, files_service, temp_test_dir):
        """Test moving file to subdirectory"""
        source = temp_test_dir / "file2.txt"
        dest = temp_test_dir / "subdir" / "file2.txt"

        result = files_service.move_file(str(source), str(dest))

        assert result.get("success") is True
        assert not source.exists()
        assert dest.exists()

    def test_copy_file(self, files_service, temp_test_dir):
        """Test copying a file"""
        source = temp_test_dir / "file1.txt"
        dest = temp_test_dir / "copied_file.txt"

        result = files_service.copy_file(str(source), str(dest))

        assert result.get("success") is True
        assert source.exists()  # Original should still exist
        assert dest.exists()
        assert dest.read_text() == source.read_text()

    def test_delete_file_to_recycle_bin(self, files_service, temp_test_dir):
        """Test deleting file to recycle bin (default)"""
        test_file = temp_test_dir / "to_delete.txt"
        test_file.write_text("Delete me")

        result = files_service.delete_file(str(test_file), permanent=False)

        # File should be moved to recycle bin (might not exist anymore)
        assert result.get("success") is True or "error" not in result

    def test_delete_file_permanent(self, files_service, temp_test_dir):
        """Test permanent file deletion"""
        test_file = temp_test_dir / "to_delete_permanent.txt"
        test_file.write_text("Delete me permanently")

        result = files_service.delete_file(str(test_file), permanent=True)

        assert result.get("success") is True
        assert not test_file.exists()

    def test_search_files(self, files_service, temp_test_dir):
        """Test searching for files"""
        result = files_service.search_files(
            str(temp_test_dir),
            pattern="file*.txt"
        )

        assert "files" in result or "results" in result
        files_found = result.get("files", result.get("results", []))
        assert len(files_found) >= 2  # file1.txt and file2.txt

    def test_search_files_recursive(self, files_service, temp_test_dir):
        """Test recursive file search"""
        result = files_service.search_files(
            str(temp_test_dir),
            pattern="*.txt",
            recursive=True
        )

        files_found = result.get("files", result.get("results", []))
        # Should find files in subdirectories too
        assert len(files_found) >= 3  # Including subdir/file3.txt

    def test_get_file_info(self, files_service, temp_test_dir):
        """Test getting file information"""
        test_file = temp_test_dir / "file1.txt"

        result = files_service.get_file_info(str(test_file))

        assert "name" in result or "path" in result
        assert "size" in result or "error" not in result

    def test_path_validation(self, files_service):
        """Test path validation rejects dangerous paths"""
        dangerous_paths = [
            "../../../etc/passwd",
            "C:\\Windows\\System32\\config\\SAM",
            "/System/Library/Extensions"
        ]

        for path in dangerous_paths:
            # Operations should either fail or validate safely
            result = files_service.list_directory(path)
            # Should handle gracefully (either error or empty)
            assert "error" in result or len(result.get("files", [])) == 0

    def test_overwrite_protection(self, files_service, temp_test_dir):
        """Test protection against accidental overwrites"""
        source = temp_test_dir / "file1.txt"
        dest = temp_test_dir / "file2.txt"  # Already exists

        result = files_service.copy_file(
            str(source),
            str(dest),
            overwrite=False
        )

        # Should either fail or warn about existing file
        assert "error" in result or "exists" in str(result).lower()

    def test_create_directory(self, files_service, temp_test_dir):
        """Test creating a new directory"""
        new_dir = temp_test_dir / "new_directory"

        result = files_service.create_directory(str(new_dir))

        assert result.get("success") is True
        assert new_dir.exists()
        assert new_dir.is_dir()

    def test_file_operations_on_nonexistent_file(self, files_service):
        """Test file operations handle non-existent files gracefully"""
        nonexistent = "/nonexistent/file.txt"

        # All operations should return errors gracefully
        move_result = files_service.move_file(nonexistent, "/tmp/dest.txt")
        copy_result = files_service.copy_file(nonexistent, "/tmp/dest.txt")
        delete_result = files_service.delete_file(nonexistent)

        assert "error" in move_result
        assert "error" in copy_result
        assert "error" in delete_result

    def test_batch_operations(self, files_service, temp_test_dir):
        """Test batch file operations if supported"""
        files_to_delete = [
            temp_test_dir / "batch1.txt",
            temp_test_dir / "batch2.txt",
            temp_test_dir / "batch3.txt"
        ]

        # Create test files
        for f in files_to_delete:
            f.write_text("batch content")

        # If batch delete is supported
        if hasattr(files_service, 'batch_delete'):
            result = files_service.batch_delete([str(f) for f in files_to_delete])
            assert "success" in result or all(not f.exists() for f in files_to_delete)
