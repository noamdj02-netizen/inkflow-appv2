# Trigger.dev Core Reference

## Task Types

### Basic Task
```typescript
import { task } from "@trigger.dev/sdk/v3";

export const myTask = task({
  id: "my-task",
  run: async (payload: { userId: string }) => {
    // do work
    return { success: true };
  },
});
```

### Scheduled Task
```typescript
import { schedules } from "@trigger.dev/sdk/v3";

export const cronTask = schedules.task({
  id: "daily-report",
  cron: "0 9 * * *", // 9am every day
  run: async (payload) => {
    // runs on schedule
  },
});
```

### Webhook Trigger
```typescript
import { webhooks } from "@trigger.dev/sdk/v3";

export const stripeWebhook = webhooks.on("stripe.payment_intent.succeeded", {
  run: async (payload) => {
    // handle webhook
  },
});
```

## Triggering Tasks
```typescript
// Fire and forget
await myTask.trigger({ userId: "123" });

// Wait for result
const result = await myTask.triggerAndWait({ userId: "123" });

// Trigger multiple
await myTask.batchTrigger([{ payload: { userId: "1" } }, { payload: { userId: "2" } }]);
```
