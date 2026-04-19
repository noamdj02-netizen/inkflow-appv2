# Caching & Queue Systems

## Caching Strategies

### Cache-Aside (Lazy Loading)
- App checks cache first → if miss, load from DB → store in cache
- Best for: read-heavy, tolerable staleness

### Write-Through
- Write to cache and DB simultaneously
- Best for: data that's read soon after write

### Cache Invalidation
- TTL-based: simple but may serve stale data
- Event-based: invalidate on write (more complex but accurate)
- Cache tags: group related keys for bulk invalidation

## Redis Patterns
```
# Simple cache
SET user:123 {json} EX 3600

# Cache with atomic operations
INCR counter:page_views

# Pub/Sub for real-time
PUBLISH channel message
SUBSCRIBE channel
```

## Queue Systems

### When to Use Queues
- Decoupling producers from consumers
- Handling traffic spikes
- Retry failed jobs automatically
- Background processing

### Queue Options
- **Redis (BullMQ)** — Simple, fast, good for most cases
- **RabbitMQ** — Advanced routing, complex topologies
- **Kafka** — High-throughput event streaming, replay
- **SQS** — Managed, AWS-native

### Queue Best Practices
- Make jobs idempotent (safe to run twice)
- Set appropriate timeouts and retry limits
- Monitor queue depth — growing queue = underprovisioned workers
- Use dead-letter queues for failed jobs
