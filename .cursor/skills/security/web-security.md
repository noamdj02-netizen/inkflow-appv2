# Web Security — OWASP Top 10

## 1. Injection (SQL, Command, LDAP)
- Use parameterized queries / prepared statements
- Never concatenate user input into queries
- Validate and whitelist input types

```javascript
// BAD
db.query(`SELECT * FROM users WHERE id = ${userId}`)
// GOOD
db.query('SELECT * FROM users WHERE id = $1', [userId])
```

## 2. Broken Authentication
- Use strong password hashing (bcrypt, argon2)
- Implement MFA for sensitive operations
- Expire sessions after inactivity
- Invalidate tokens on logout

## 3. XSS (Cross-Site Scripting)
- Escape all user-controlled output in HTML
- Use Content-Security-Policy headers
- Avoid innerHTML — use textContent or framework escaping

## 4. Broken Access Control
- Check authorization on every request (not just at login)
- Use deny-by-default
- Validate object ownership (user can only access their own data)

## 5. Security Misconfiguration
- Remove default credentials and example pages
- Disable directory listing
- Set security headers: HSTS, X-Frame-Options, CSP

## 6. CSRF Protection
- Use CSRF tokens for state-changing requests
- Verify Origin/Referer headers
- Use SameSite=Strict cookies

## Security Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
```
