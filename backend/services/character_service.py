import os
import json
import zipfile
import shutil
from pathlib import Path
from typing import Dict, List, Optional
from uuid import uuid4
import jsonschema

# Character pack directory
CHARACTERS_DIR = Path(__file__).parent.parent.parent / "characters"
SCHEMA_PATH = CHARACTERS_DIR / "character-schema.json"

class CharacterService:
    def __init__(self):
        self.characters_dir = CHARACTERS_DIR
        self.characters_dir.mkdir(exist_ok=True)
        
        # Load schema for validation
        self.schema = None
        if SCHEMA_PATH.exists():
            with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
                self.schema = json.load(f)
    
    def list_packs(self) -> List[Dict]:
        """List all installed character packs"""
        packs = []
        
        for pack_dir in self.characters_dir.iterdir():
            if not pack_dir.is_dir():
                continue
            
            manifest_path = pack_dir / "character.json"
            if not manifest_path.exists():
                continue
            
            try:
                with open(manifest_path, 'r', encoding='utf-8') as f:
                    manifest = json.load(f)
                
                packs.append({
                    "id": manifest.get("id", pack_dir.name),
                    "name": manifest.get("name", "Unnamed Character"),
                    "author": manifest.get("author"),
                    "version": manifest.get("version", "0.0.0"),
                    "description": manifest.get("description"),
                    "path": str(pack_dir),
                    "thumbnail": self._get_thumbnail_path(pack_dir, manifest)
                })
            except Exception as e:
                print(f"Error loading pack {pack_dir}: {e}")
                continue
        
        return packs
    
    def get_pack(self, pack_id: str) -> Optional[Dict]:
        """Get full manifest for a specific character pack"""
        pack_dir = self.characters_dir / pack_id
        manifest_path = pack_dir / "character.json"
        
        if not manifest_path.exists():
            return None
        
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
            
            # Resolve asset paths to be relative to the pack
            manifest['basePath'] = f"character-packs/{pack_id}"
            
            return manifest
        except Exception as e:
            print(f"Error loading pack {pack_id}: {e}")
            return None
    
    def validate_manifest(self, manifest: Dict) -> tuple[bool, Optional[str]]:
        """Validate a character manifest against the schema"""
        if not self.schema:
            return False, "Schema not loaded"
        
        try:
            jsonschema.validate(instance=manifest, schema=self.schema)
            return True, None
        except jsonschema.exceptions.ValidationError as e:
            return False, str(e)
    
    def import_pack(self, zip_path: str) -> tuple[bool, Optional[str], Optional[str]]:
        """
        Import a character pack from a zip file
        
        Returns:
            (success, error_message, pack_id)
        """
        zip_path = Path(zip_path)
        
        if not zip_path.exists():
            return False, "Zip file not found", None
        
        if not zipfile.is_zipfile(zip_path):
            return False, "Invalid zip file", None
        
        # Create temp extraction directory
        temp_id = str(uuid4())
        temp_dir = self.characters_dir / f"_temp_{temp_id}"
        temp_dir.mkdir(exist_ok=True)
        
        try:
            # Extract zip
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # Find character.json (might be in root or subdirectory)
            manifest_path = self._find_manifest(temp_dir)
            
            if not manifest_path:
                shutil.rmtree(temp_dir)
                return False, "No character.json found in zip", None
            
            # Load and validate manifest
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
            
            valid, error = self.validate_manifest(manifest)
            if not valid:
                shutil.rmtree(temp_dir)
                return False, f"Invalid manifest: {error}", None
            
            pack_id = manifest.get("id")
            if not pack_id:
                shutil.rmtree(temp_dir)
                return False, "Manifest missing 'id' field", None
            
            # Check if pack already exists
            target_dir = self.characters_dir / pack_id
            if target_dir.exists():
                # Backup existing
                backup_dir = self.characters_dir / f"_backup_{pack_id}_{uuid4()}"
                target_dir.rename(backup_dir)
            
            # Move extracted files to final location
            pack_root = manifest_path.parent
            shutil.move(str(pack_root), str(target_dir))
            
            # Clean up temp directory
            if temp_dir.exists():
                shutil.rmtree(temp_dir)
            
            return True, None, pack_id
        
        except Exception as e:
            # Clean up on error
            if temp_dir.exists():
                shutil.rmtree(temp_dir)
            return False, f"Import failed: {str(e)}", None
    
    def delete_pack(self, pack_id: str) -> tuple[bool, Optional[str]]:
        """Delete a character pack"""
        pack_dir = self.characters_dir / pack_id
        
        if not pack_dir.exists():
            return False, "Pack not found"
        
        # Don't allow deleting built-in packs (optional safeguard)
        # You could mark built-in packs in their manifest with "builtin": true
        
        try:
            shutil.rmtree(pack_dir)
            return True, None
        except Exception as e:
            return False, f"Failed to delete pack: {str(e)}"
    
    def _find_manifest(self, root_dir: Path) -> Optional[Path]:
        """Find character.json in directory tree"""
        # Check root
        manifest = root_dir / "character.json"
        if manifest.exists():
            return manifest
        
        # Check one level deep
        for subdir in root_dir.iterdir():
            if subdir.is_dir():
                manifest = subdir / "character.json"
                if manifest.exists():
                    return manifest
        
        return None
    
    def _get_thumbnail_path(self, pack_dir: Path, manifest: Dict) -> Optional[str]:
        """Get thumbnail image path for character preview"""
        # Check for explicit thumbnail in manifest
        if "thumbnail" in manifest:
            return f"character-packs/{pack_dir.name}/{manifest['thumbnail']}"
        
        # Try to get first frame of idle animation
        idle_anim = manifest.get("animations", {}).get("idle")
        if idle_anim:
            if idle_anim.get("type") == "spriteSheet":
                return f"character-packs/{pack_dir.name}/{idle_anim['spriteSheet']}"
            elif idle_anim.get("type") == "frames" and idle_anim.get("frames"):
                return f"character-packs/{pack_dir.name}/{idle_anim['frames'][0]['image']}"
        
        return None


    def get_personalities(self) -> Dict:
        """Get all personality presets"""
        personalities_file = Path(__file__).parent.parent.parent / "character_personalities.json"

        if personalities_file.exists():
            try:
                with open(personalities_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading personalities: {e}")

        # Default personalities
        return {
            "helpful": {
                "name": "Helpful Assistant",
                "description": "Professional and helpful, focuses on solving problems efficiently",
                "system_prompt": "You are a helpful and professional AI assistant. Be concise, accurate, and focus on solving the user's problems efficiently.",
                "traits": ["professional", "efficient", "concise"]
            },
            "friendly": {
                "name": "Friendly Companion",
                "description": "Warm and conversational, like talking to a friend",
                "system_prompt": "You are a friendly and warm AI companion. Be conversational, supportive, and engaging.",
                "traits": ["warm", "conversational", "supportive"]
            },
            "expert": {
                "name": "Technical Expert",
                "description": "Deep technical knowledge, detailed explanations",
                "system_prompt": "You are a technical expert. Provide detailed, accurate explanations with technical depth.",
                "traits": ["technical", "detailed", "precise"]
            },
            "creative": {
                "name": "Creative Thinker",
                "description": "Imaginative and innovative",
                "system_prompt": "You are creative and imaginative. Think outside the box and suggest innovative solutions.",
                "traits": ["imaginative", "innovative", "creative"]
            }
        }


# Singleton instance
_character_service = CharacterService()

def get_character_service() -> CharacterService:
    return _character_service
