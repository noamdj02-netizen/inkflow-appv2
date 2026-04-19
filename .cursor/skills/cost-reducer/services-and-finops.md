# Services & FinOps Optimization

## SaaS Audit
- List all active subscriptions and their actual usage
- Identify duplicate tools (e.g., two project management tools)
- Downgrade unused seats or tiers
- Negotiate annual contracts for 20-30% discount
- Check for free/open-source alternatives

## AI & LLM Costs
- Use smaller models for simple tasks (e.g., GPT-4o-mini instead of GPT-4o)
- Cache LLM responses for repeated prompts
- Implement prompt compression to reduce token count
- Set max_tokens limits to avoid runaway responses
- Use batch inference APIs (cheaper than real-time)

## Observability Tools
- Datadog, New Relic, etc. — audit metrics/logs actually used in dashboards
- Reduce cardinality of custom metrics
- Use open-source alternatives (Grafana + Prometheus) for internal tooling

## FinOps Practices
- Tag all cloud resources by team/project/environment
- Set billing alerts and budgets
- Review cost anomaly reports weekly
- Use cloud provider cost calculators before deploying new services
- Implement chargeback/showback for multi-team orgs
