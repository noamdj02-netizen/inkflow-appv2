# n8n API Reference

## REST API Base URL
`https://your-n8n-instance.com/api/v1`

## Authentication
Header: `X-N8N-API-KEY: your-api-key`

## Key Endpoints

### Workflows
- `GET /workflows` — List all workflows
- `GET /workflows/:id` — Get workflow by ID
- `POST /workflows` — Create workflow
- `PUT /workflows/:id` — Update workflow
- `DELETE /workflows/:id` — Delete workflow
- `POST /workflows/:id/activate` — Activate workflow
- `POST /workflows/:id/deactivate` — Deactivate workflow

### Executions
- `GET /executions` — List executions
- `GET /executions/:id` — Get execution details
- `DELETE /executions/:id` — Delete execution

### Credentials
- `GET /credentials` — List credentials
- `POST /credentials` — Create credential

## Webhook Execution
Trigger a workflow via webhook:
`POST https://your-n8n-instance.com/webhook/your-path`

## Common API Patterns
```javascript
// Activate a workflow
fetch('https://n8n.example.com/api/v1/workflows/123/activate', {
  method: 'POST',
  headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY }
})
```
