# Code-Level Cost Savings

## API Calls
- Cache responses to avoid redundant API calls
- Batch requests instead of N+1 calls
- Use webhooks instead of polling
- Implement exponential backoff to avoid retry storms

## Database Queries
- Add indexes for frequent query patterns
- Use pagination instead of loading all records
- Avoid SELECT * — fetch only needed columns
- Use read replicas for read-heavy workloads
- Cache query results with Redis/Memcached for repeated queries

## Compute Efficiency
- Move CPU-heavy work to background jobs
- Use streaming instead of loading entire files into memory
- Optimize image processing (resize on upload, not on every request)
- Lazy-load resources and data

## Serverless Optimization
- Reduce cold starts with provisioned concurrency (only for critical paths)
- Right-size Lambda memory (more memory = faster = sometimes cheaper)
- Use Lambda response streaming for large payloads
- Minimize deployment package size

## Logging & Monitoring
- Set log retention policies (don't keep logs forever)
- Filter noisy logs before sending to expensive observability tools
- Use sampling for high-volume traces
- Archive old metrics to cheap storage
