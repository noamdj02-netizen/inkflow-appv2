---
name: inkflow-scale-micro-entreprise
description: Scaler InkFlow (SaaS tatouage) et la micro-entreprise — routeur vers playbook, coûts, sécurité, analytics, growth et support. Utiliser quand l’utilisateur parle de croissance, scale, « tout seul », coûts infra, acquisition, churn ou ops.
---

# InkFlow — scale micro-entreprise + produit

Tu accompagnes une **micro-entreprise** qui édite **InkFlow** (Next/Vite + Supabase + Stripe + emails + SMS optionnel). Le détail actionnable est dans **`docs/INKFLOW-SCALE-PLAYBOOK.md`** : charge-le en priorité sur ce sujet.

## Process

1. **Clarifier le goulot** — technique (perf, coûts, incidents) vs business (acquisition, conversion, rétention, trésorerie).
2. **Ouvrir le playbook** — `docs/INKFLOW-SCALE-PLAYBOOK.md` : checklists par pilier et liens vers la doc interne (`docs/CONFIGURATION.md`, RLS, Edge Functions).
3. **Déléguer au skill spécialisé** selon le besoin (chemins relatifs au repo) :
   - Archi / charge / perf → `.cursor/skills/scalability/SKILL.md`
   - Factures cloud & optim budget → `.cursor/skills/cost-reducer/SKILL.md`
   - Auth, RLS, paiements, secrets → `.cursor/skills/security/SKILL.md` + `.agents/skills/vibe-security/SKILL.md`
   - Mesure & funnels → `.cursor/skills/analytics-tracking/SKILL.md`
   - Offres & tarifs → `.cursor/skills/pricing-strategy/SKILL.md`
   - Landing / pricing / conversion → `.cursor/skills/page-cro/SKILL.md`
   - Paywall in-app → `.cursor/skills/paywall-upgrade-cro/SKILL.md`
   - Idées canaux & tactiques → `.cursor/skills/marketing-ideas/SKILL.md`
   - Ads → `.cursor/skills/paid-ads/SKILL.md`
   - Marketing → ventes / leads → `.cursor/skills/revops/SKILL.md`
   - Support & ton → `.cursor/skills/customer-support/SKILL.md`
   - Annulation / churn → `.cursor/skills/churn-prevention/SKILL.md`
4. **Implémenter par petits incréments** — une hypothèse, une métrique, une PR ; pas de « big bang ».

## Rules

- Ne pas dupliquer le playbook dans le chat : **renvoyer vers** `docs/INKFLOW-SCALE-PLAYBOOK.md` pour la liste complète et les priorités par phase.
- Côté InkFlow : respecter **studioId**, RLS Supabase, Edge Functions pour mutations sensibles ; jamais de secrets côté client.
- Micro-entreprise : prioriser **marge** et **temps fondateur** avant l’industrialisation (process lourds, tooling excessif).
