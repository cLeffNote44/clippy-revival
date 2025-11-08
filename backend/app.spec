# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Clippy Revival Backend
This file configures how PyInstaller bundles the FastAPI backend into a standalone executable.
"""

import sys
from pathlib import Path

block_cipher = None

# Define the backend directory
backend_dir = Path.cwd()
project_root = backend_dir.parent

# Data files to include
datas = [
    # Character schema for validation
    (str(project_root / 'characters' / 'character-schema.json'), 'characters'),
]

# Hidden imports needed for FastAPI, uvicorn, and other dependencies
hiddenimports = [
    # FastAPI and dependencies
    'fastapi',
    'fastapi.middleware',
    'fastapi.middleware.cors',
    'fastapi.staticfiles',
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',

    # Pydantic
    'pydantic',
    'pydantic.fields',
    'pydantic.main',
    'pydantic_settings',

    # WebSocket
    'websockets',
    'websockets.legacy',
    'websockets.legacy.server',

    # HTTP client
    'httpx',
    'httpx._transports',
    'httpx._transports.default',

    # System monitoring
    'psutil',

    # Windows-specific
    'win32com',
    'win32com.client',
    'pythoncom',
    'pywintypes',

    # Image processing
    'PIL',
    'PIL._imaging',

    # Ollama
    'ollama',

    # Playwright
    'playwright',
    'playwright.sync_api',
    'playwright.async_api',

    # Other utilities
    'send2trash',
    'watchdog',
    'jsonschema',
    'dotenv',

    # All our modules
    'api',
    'api.ai_router',
    'api.system_router',
    'api.files_router',
    'api.software_router',
    'api.web_router',
    'api.characters',
    'api.scheduler_router',
    'services',
    'services.ollama_service',
    'services.agent_service',
    'services.files_service',
    'services.system_service',
    'services.software_service',
    'services.web_service',
    'services.character_service',
    'services.websocket_manager',
    'services.scheduler_service',
    'services.task_handlers',
    'services.security_service',
]

a = Analysis(
    ['app.py'],
    pathex=[str(backend_dir)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Exclude unnecessary modules to reduce size
        'tkinter',
        'matplotlib',
        'numpy',
        'pandas',
        'scipy',
        'IPython',
        'jupyter',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(
    a.pure,
    a.zipped_data,
    cipher=block_cipher
)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='clippy-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,  # Console app (backend runs in background)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='clippy-backend',
)
