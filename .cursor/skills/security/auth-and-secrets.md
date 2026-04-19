# Auth & Secrets Management

## Authentication Best Practices
- Hash passwords with bcrypt (cost factor 12+) or argon2id
- Use JWTs with short expiry (15min access, 7d refresh)
- Store refresh tokens in httpOnly cookies, not localStorage
- Implement account lockout after N failed attempts
- Log all auth events (login, logout, failures)

## JWT Security
```javascript
// Sign with strong secret or RS256
jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: '15m',
  algorithm: 'HS256'
})

// Always verify on every request
jwt.verify(token, process.env.JWT_SECRET)
```

## OAuth / SSO
- Use PKCE for public clients (SPAs, mobile apps)
- Validate state parameter to prevent CSRF
- Use short-lived authorization codes
- Store tokens securely (httpOnly cookies > localStorage)

## Secrets Management
- Never commit secrets to git (use .gitignore + pre-commit hooks)
- Use environment variables for local dev
- Use secret managers in production: AWS Secrets Manager, Vault, Doppler
- Rotate secrets regularly and after any suspected exposure
- Use different secrets per environment (dev/staging/prod)

## API Keys
- Generate cryptographically random keys (not sequential IDs)
- Hash API keys in the database (store hash, not plaintext)
- Scope API keys to minimum required permissions
- Log API key usage for anomaly detection
