# Trigger.dev Advanced Patterns

## Retries & Error Handling
```typescript
export const resilientTask = task({
  id: "resilient-task",
  retry: {
    maxAttempts: 5,
    factor: 2,
    minTimeoutInMs: 500,
  },
  run: async (payload) => {
    try {
      await riskyOperation();
    } catch (error) {
      if (error.code === "RETRYABLE") throw error; // will retry
      // non-retryable: log and return
      return { failed: true, reason: error.message };
    }
  },
});
```

## Waiting for External Events
```typescript
// Wait for a webhook or external signal
const result = await wait.for({ seconds: 3600 }); // wait up to 1hr

// Wait for another task
const childResult = await childTask.triggerAndWait({ id: payload.id });
```

## Concurrency Control
```typescript
export const limitedTask = task({
  id: "limited-task",
  concurrencyLimit: 5, // max 5 running at once
  queue: {
    name: "my-queue",
    concurrencyLimit: 10,
  },
  run: async (payload) => { ... },
});
```

## Parent-Child Tasks
```typescript
export const parentTask = task({
  id: "parent",
  run: async (payload: { userIds: string[] }) => {
    // Fan out to child tasks
    const results = await childTask.batchTriggerAndWait(
      payload.userIds.map(id => ({ payload: { userId: id } }))
    );
    return results;
  },
});
```

## Idempotency
```typescript
// Use idempotency keys to prevent duplicate runs
await myTask.trigger(payload, {
  idempotencyKey: `process-order-${orderId}`,
});
```
