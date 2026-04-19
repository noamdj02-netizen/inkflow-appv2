# Database Security & Dependencies

## Database Security
- Use least-privilege DB users (app user ≠ admin user)
- Encrypt data at rest and in transit (SSL connections)
- Audit sensitive data access
- Never expose DB port publicly — use VPC/private network
- Regular backups with encryption, tested restores

## Dependency Security
- Run `npm audit` / `pip check` / `bundle audit` regularly
- Pin dependency versions to avoid supply chain attacks
- Use Dependabot or Renovate for automated updates
- Review changelogs before updating major versions
- Scan container images (Trivy, Snyk)

## Secrets in Code Scanning
Tools to find exposed secrets:
- `git-secrets` — prevent commits with secrets
- `trufflehog` — scan git history for secrets
- `detect-secrets` — baseline and scan

## Data Privacy (PII)
- Minimize PII collection — only store what you need
- Encrypt PII fields at the column level for extra protection
- Implement right-to-deletion (GDPR/CCPA)
- Anonymize data in dev/staging environments
- Document what PII is stored and why
