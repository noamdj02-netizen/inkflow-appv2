# Trigger.dev Configuration

## Project Setup
```bash
npx trigger.dev@latest init
```

## trigger.config.ts
```typescript
import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_your_project_id",
  runtime: "node",
  logLevel: "log",
  maxDuration: 300, // seconds
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },
  dirs: ["./src/trigger"], // where your tasks live
});
```

## Environment Variables
```bash
# .env
TRIGGER_SECRET_KEY=tr_dev_xxxxxxxxxxxx
```

## Local Development
```bash
npx trigger.dev@latest dev
```

## Deployment
```bash
npx trigger.dev@latest deploy
```

## Dashboard
- View runs: cloud.trigger.dev
- Real-time logs and traces
- Replay failed runs
- Manage schedules
