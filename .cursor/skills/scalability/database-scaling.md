# Database Scaling

## Read Scaling
- **Read replicas** — Route SELECT queries to replicas
- **Connection pooling** — Use PgBouncer/ProxySQL to reduce connection overhead
- **Query caching** — Cache result sets in Redis for expensive queries

## Write Scaling
- **Vertical scaling** — Larger instance (simplest, has limits)
- **Sharding** — Split data across multiple DB instances by key
- **CQRS** — Separate read and write models

## Indexing
- Index columns used in WHERE, JOIN, ORDER BY
- Composite indexes: column order matters (most selective first)
- Partial indexes for filtered queries
- Avoid over-indexing — each index slows writes

## Schema Optimization
- Use appropriate data types (don't use VARCHAR for numbers)
- Normalize to eliminate duplication, denormalize for read performance
- Partition large tables by date or range
- Archive old data to cheaper storage

## Database Choices by Scale
| Scale | Solution |
|-------|----------|
| < 10GB | Single PostgreSQL |
| 10-500GB | PostgreSQL + read replicas |
| > 500GB | Sharding or NewSQL (CockroachDB, PlanetScale) |
| Massive reads | Add Redis cache layer |
| Time-series data | TimescaleDB or InfluxDB |
