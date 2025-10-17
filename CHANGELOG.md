# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Character system with personality traits and system prompts
- Task scheduler with cron-like scheduling capabilities
- Built-in task handlers (system cleanup, health check, backup reminders, log rotation)
- SVG Clippy character animations
- Feature flags configurable via environment variables

## [1.1.0] - 2025-01-17

### Added
- Complete frontend service layer (http.js, api.js, ws.js, config.js)
- MIT License file
- Contributing guidelines (CONTRIBUTING.md)
- Code of Conduct (CODE_OF_CONDUCT.md)
- Security policy (SECURITY.md)
- Environment configuration template (.env.example)
- Node version management (.nvmrc)
- ESLint and Prettier configurations
- Python tooling configuration (pyproject.toml)
- GitHub Actions CI/CD workflows
- Automated dependency updates via Dependabot
- Linting and formatting npm scripts
- Python 3.12 version check at startup
- Comprehensive test infrastructure (Jest, pytest, Playwright)
- Test coverage requirements (60% threshold)
- Development roadmap (ROADMAP.md)
- IPC channel whitelist validation
- Content Security Policy headers

### Fixed
- Critical security vulnerability: replaced eval() with json.loads in WebSocket handler
- Backend executable name mismatch (backend.exe → clippy-backend.exe)
- Missing frontend service imports in Characters.js and BuddyWindow.js
- Webpack path aliases configuration
- CORS configuration tightened (removed file:// protocol)

### Changed
- Standardized Python version to 3.12
- Standardized Node.js version to 20 LTS
- Updated documentation with consistent version requirements
- Improved security defaults in backend CORS middleware
- Hardened Electron BrowserWindow security settings
- Enhanced preload script with input validation

### Security
- Eliminated dangerous eval() usage in backend
- Removed file:// protocol from CORS allowed origins
- Added structured input validation approach
- Enabled sandbox mode for all Electron windows
- Disabled Node.js integration in renderer processes
- Implemented Content Security Policy
- Added IPC channel whitelist and validation

## [1.0.0] - 2024-01-01

### Added
- Initial release
- Core Electron + React + FastAPI architecture
- Ollama AI integration
- Character pack system
- System monitoring features
- File operations with recycle bin support
- Software management via winget
- Web automation with Playwright
- WebSocket real-time updates
- Material-UI dashboard interface
- Floating character window
- System tray integration