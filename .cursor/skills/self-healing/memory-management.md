# Memory Management & Leak Detection

## Node.js Memory Tools

### Built-in
```javascript
// Log memory usage periodically
setInterval(() => {
  const mem = process.memoryUsage();
  console.log({
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
    rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
  });
}, 30000);
```

### Heap Snapshots
```javascript
const v8 = require('v8');
// Take snapshot
const snapshot = v8.writeHeapSnapshot();
// Compare two snapshots in Chrome DevTools Memory tab
```

## Common Fixes

### Event Listener Leaks
```javascript
// BAD: adds listener every call
function setup() {
  emitter.on('data', handler);
}

// GOOD: remove when done
function setup() {
  emitter.on('data', handler);
  return () => emitter.off('data', handler); // cleanup function
}
```

### Cache Without Eviction
```javascript
// BAD: unbounded Map
const cache = new Map();

// GOOD: LRU cache with size limit
import LRU from 'lru-cache';
const cache = new LRU({ max: 500, ttl: 1000 * 60 * 10 });
```

## Automatic Recovery Patterns
```javascript
// Restart worker if memory exceeds threshold
if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) {
  logger.warn('Memory threshold exceeded, restarting worker');
  process.exit(1); // let process manager restart
}
```
