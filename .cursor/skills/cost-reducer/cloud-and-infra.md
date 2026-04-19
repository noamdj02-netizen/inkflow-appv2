# Cloud & Infrastructure Cost Optimization

## Compute
- Right-size instances: compare actual CPU/RAM usage vs. provisioned
- Use spot/preemptible instances for non-critical workloads (up to 90% savings)
- Auto-scaling: scale down during off-hours
- Consolidate underutilized instances
- Use ARM-based instances (AWS Graviton, etc.) — 20-40% cheaper

## Storage
- Move cold data to cheaper storage tiers (S3 Glacier, Nearline, Archive)
- Delete unattached volumes and old snapshots
- Enable S3 Intelligent-Tiering for variable access patterns
- Compress backups before storing

## Networking
- Reduce cross-region data transfer (colocate services)
- Use CDN for static assets to reduce origin bandwidth
- Audit NAT Gateway usage — often a hidden cost
- Use VPC endpoints instead of public internet for AWS services

## Databases
- Use reserved instances for steady-state DB workloads (up to 60% savings)
- Enable auto-pause for dev/staging databases
- Right-size RDS instances based on actual usage
- Consider Aurora Serverless for variable workloads

## Kubernetes / Containers
- Set resource requests and limits accurately
- Use cluster autoscaler
- Clean up unused images and registries
- Consider Fargate Spot for batch workloads
