# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Clippy Revival seriously. If you have discovered a security vulnerability, please follow these steps:

### DO NOT
- Create a public GitHub issue
- Disclose the vulnerability publicly before it's been fixed

### DO
1. Email details to: cLeffNote44@pm.me
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

### What to Expect
- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix Timeline**: Depends on severity (critical: < 1 week, high: < 2 weeks)
- **Credit**: Security researchers will be credited (unless they prefer to remain anonymous)

## Security Best Practices for Contributors

### Dependencies
- Regularly update dependencies
- Review security advisories
- Use `npm audit` and `pip-audit`

### Code Reviews
- All code must be reviewed before merging
- Pay special attention to:
  - User input validation
  - Authentication/authorization
  - Data sanitization
  - API endpoints

### Sensitive Data
- Never commit:
  - API keys
  - Passwords
  - Personal information
  - Private keys/certificates

### Secure Coding
- Validate all inputs
- Use parameterized queries
- Implement proper error handling
- Follow OWASP guidelines
- Use secure communication (HTTPS/WSS)

## Known Security Considerations

### Electron
- Context isolation is enabled
- Node integration is disabled
- Remote module is disabled
- WebSecurity is enabled

### Backend
- API runs on localhost only
- File operations are sandboxed
- Input validation via Pydantic
- Rate limiting on sensitive endpoints

### AI Integration
- Ollama runs locally
- No data sent to external services
- User prompts are not logged

## Security Updates

Security updates will be released as:
- **Critical**: Immediate patch release
- **High**: Within next patch release
- **Medium/Low**: In next minor release

## Disclosure Policy

- Security issues will be disclosed after a fix is available
- CVEs will be requested for significant vulnerabilities
- Users will be notified via release notes and security advisories
