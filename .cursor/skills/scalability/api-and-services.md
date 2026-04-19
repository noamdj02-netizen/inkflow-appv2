# API & Services Scaling

## Rate Limiting
- Implement per-user and global rate limits
- Use token bucket or sliding window algorithm
- Return 429 with Retry-After header

## Load Balancing
- Round-robin for stateless services
- Least connections for varying request times
- Sticky sessions only when absolutely necessary (prefer stateless)
- Health checks on all instances

## API Design for Scale
- Use pagination for list endpoints (cursor-based > offset-based at scale)
- Support partial responses (field selection)
- Use async/background jobs for heavy operations
- Return 202 Accepted + job ID for long-running tasks

## Microservices
- Decompose by business domain, not technical layer
- Use async messaging (queues) between services where possible
- Implement circuit breakers to prevent cascade failures
- Use API gateways for cross-cutting concerns (auth, rate limiting, logging)

## CDN & Edge
- Cache static assets at CDN (images, JS, CSS)
- Cache API responses at edge for public/read-heavy data
- Use edge functions for personalization without origin hits
