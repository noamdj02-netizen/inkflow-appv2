# n8n Workflow Reference

## Core Node Types

### Triggers
- **Webhook** — HTTP trigger for incoming requests
- **Schedule** — Cron-based time trigger
- **Email Trigger** — Trigger on new email
- **Form Trigger** — Trigger on form submission

### Data Transformation
- **Set** — Add/modify fields
- **Code** — Custom JavaScript/Python logic
- **Function** — Legacy JS function node
- **Merge** — Combine multiple data streams
- **Split In Batches** — Process large datasets in chunks
- **IF** — Conditional branching
- **Switch** — Multi-way branching

### Actions
- **HTTP Request** — Call any REST API
- **Send Email** — SMTP/Gmail/etc.
- **Slack** — Send messages to Slack
- **Google Sheets** — Read/write spreadsheets
- **Database nodes** — MySQL, PostgreSQL, MongoDB

## Common Patterns

### Webhook → Process → Respond
```
Webhook → Code (transform) → Respond to Webhook
```

### Polling (Schedule-based)
```
Schedule Trigger → HTTP Request → IF (new data?) → Process → Store
```

### Error Handling
```
Main Flow → [on error] → Error Handler → Notify (Slack/Email)
```

## Expressions Cheatsheet
- `{{ $json.field }}` — Access current item field
- `{{ $node["NodeName"].json.field }}` — Access another node's output
- `{{ $now.toISO() }}` — Current timestamp
- `{{ $items().length }}` — Number of items
- `{{ $json.field.toString() }}` — Convert to string
