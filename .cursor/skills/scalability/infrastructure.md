# Infrastructure Scaling

## Horizontal vs Vertical
- **Horizontal** (scale out): Add more instances — preferred for stateless apps
- **Vertical** (scale up): Bigger instance — simpler but has limits and creates SPOF

## Auto-Scaling
- Scale based on CPU, memory, request count, or custom metrics
- Set cooldown periods to prevent thrashing
- Use predictive scaling for known traffic patterns
- Always set min AND max instance counts

## Container Orchestration (Kubernetes)
- Use Horizontal Pod Autoscaler (HPA) for CPU/memory-based scaling
- Use KEDA for event-driven autoscaling (queue depth, etc.)
- Set resource requests/limits on all pods
- Use node pools for different workload types

## Multi-Region
- Active-active: traffic in multiple regions simultaneously
- Active-passive: failover to secondary region
- Use global load balancers to route to nearest region
- Replicate data with acceptable lag (know your RPO/RTO)

## Infrastructure as Code
- Always use IaC (Terraform, Pulumi, CDK)
- Version control all infrastructure changes
- Use modules for reusable components
- Separate state per environment (dev/staging/prod)
