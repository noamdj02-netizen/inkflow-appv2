# Failure Pattern Recognition

## Memory Leak Patterns
- **Symptom:** RSS/heap grows steadily, never released
- **Common causes:** Event listeners not removed, circular references, global cache without eviction
- **Signature:** `process.memoryUsage().heapUsed` trends upward over time

## Connection Pool Exhaustion
- **Symptom:** Requests timeout, "connection pool exhausted" errors
- **Common causes:** Connections not released after errors, pool too small for load
- **Signature:** Pool wait time increasing, active connections at max

## Cascading Failures
- **Symptom:** One service failure causes others to fail
- **Common causes:** Missing circuit breakers, timeout not set, retry storms
- **Signature:** Error rate spikes propagating across services

## CPU Starvation
- **Symptom:** Event loop lag, slow responses, timeouts
- **Common causes:** Blocking synchronous operations, infinite loops, CPU-bound work on main thread
- **Signature:** Event loop delay > 100ms, CPU at 100%

## Disk Space Exhaustion
- **Symptom:** Write failures, app crashes
- **Common causes:** Log accumulation, temp files not cleaned, unbounded data growth
- **Signature:** `df -h` shows > 90% usage, write errors in logs

## Detection Commands
```bash
# Memory trend
watch -n 5 'ps aux | grep node | awk "{print \$6}"'

# Event loop lag (Node.js)
setInterval(() => {
  const start = Date.now();
  setImmediate(() => console.log('lag:', Date.now() - start, 'ms'));
}, 1000);

# Disk usage
df -h && du -sh /var/log/* | sort -h | tail -20
```
