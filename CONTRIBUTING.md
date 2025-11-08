# Contributing to Clippy Revival

Thank you for your interest in contributing to Clippy Revival! This document provides guidelines and instructions for contributing to the project.

## 📋 Prerequisites

### Required Software
- **Node.js**: v20 LTS (20.x)
- **Python**: 3.12
- **Git**: Latest version
- **Ollama**: For AI features
- **Windows**: 10/11 (primary platform)

### Development Tools
- **Code Editor**: VS Code recommended
- **Package Managers**: npm (v9+), pip
- **Python Virtual Environment**: venv

## 🚀 Getting Started

### 1. Fork and Clone
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/clippy-revival.git
cd clippy-revival
```

### 2. Setup Development Environment

#### Frontend Setup
```bash
# Install Node dependencies
npm install

# Create .env file for local development
cp .env.example .env
```

#### Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cd ..
```

### 3. Run Development Servers
```bash
# Start both frontend and backend
npm run dev
```

## 🌳 Branching Strategy

We use a feature branch workflow:

- `main` - Stable, production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `chore/*` - Maintenance and cleanup
- `docs/*` - Documentation updates

### Branch Naming Examples
- `feature/voice-commands`
- `fix/websocket-reconnect`
- `chore/update-dependencies`
- `docs/api-documentation`

## 📝 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples
```
feat(chat): add markdown rendering support

fix(backend): resolve WebSocket disconnection issue

docs(readme): update installation instructions
```

## 💻 Code Style

### JavaScript/TypeScript
- Use ESLint configuration provided
- 2 spaces for indentation
- Single quotes for strings
- No semicolons (optional)
- Meaningful variable names

### Python
- Follow PEP 8
- Use Black for formatting
- Type hints where appropriate
- Docstrings for all public functions

### Running Linters
```bash
# JavaScript/TypeScript
npm run lint
npm run lint:fix

# Python
cd backend
ruff check .
black .
```

## 🧪 Testing

### Running Tests
```bash
# Frontend tests
npm test

# Backend tests
cd backend
pytest

# E2E tests
npm run test:e2e
```

### Writing Tests
- Write unit tests for new features
- Update existing tests when modifying code
- Aim for >80% code coverage
- Use descriptive test names

## 📦 Pull Request Process

### Before Submitting

1. **Update from upstream**
```bash
git fetch upstream
git rebase upstream/develop
```

2. **Run all checks**
```bash
npm run lint
npm test
cd backend && pytest
```

3. **Update documentation**
- Update README if needed
- Add/update code comments
- Update CHANGELOG.md

### PR Guidelines

1. **Title**: Use conventional commit format
2. **Description**: Include:
   - What changes were made
   - Why they were necessary
   - How to test the changes
   - Screenshots for UI changes
3. **Size**: Keep PRs focused and small
4. **Tests**: Include tests for new features
5. **Documentation**: Update relevant docs

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] E2E tests pass (if applicable)

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

## 🔒 Security

### Reporting Vulnerabilities
- **DO NOT** create public issues for security vulnerabilities
- Email security concerns to: security@clippyrevival.com
- Include detailed description and steps to reproduce

### Security Best Practices
- Never commit sensitive data (API keys, passwords)
- Validate all user input
- Use parameterized queries
- Keep dependencies updated
- Follow OWASP guidelines

## 🏗️ Architecture Guidelines

### Frontend (Electron + React)
- Components should be functional with hooks
- Use Material-UI components consistently
- State management via Zustand
- API calls through service layer

### Backend (FastAPI)
- RESTful API design
- Pydantic models for validation
- Service layer for business logic
- Dependency injection where appropriate

### Communication
- REST for request-response
- WebSockets for real-time updates
- IPC for Electron main-renderer

## 📚 Resources

### Documentation
- [Project Architecture](ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Development Setup](README.md#development-setup)

### External Resources
- [Electron Documentation](https://electronjs.org/docs)
- [React Documentation](https://react.dev)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Material-UI](https://mui.com)

## 🤝 Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

- Open a [Discussion](https://github.com/clippy-revival/discussions)
- Check existing [Issues](https://github.com/clippy-revival/issues)

Thank you for contributing to Clippy Revival! 🎉
