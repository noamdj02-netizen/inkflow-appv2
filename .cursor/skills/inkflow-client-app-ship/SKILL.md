---
name: inkflow-client-app-ship
description: Use when reviewing code or shipping reliable, tattoo-studio-facing features on the InkFlow client app (web portal, booking tunnel, mobile client).
---

# InkFlow — Revue & livraison app client (tatoueur → client)

Skill pour un agent qui **relit le code** et **ajoute des fonctionnalités fiables** pour les parcours **clients finaux** (réservation, espace client, suivi), sans casser la sécurité ni la DA InkFlow.

## Quand l’utiliser

- Refactor, PR ou nouvelle feature touchant **`pages/public/`** (booking, vitrine), **`ClientDashboard`**, **`inkflow-mobile/`**, hooks `client*`, profil santé, messagerie client.
- Demande explicite : fiabilité, accessibilité tactile, gestion d’erreurs, cohérence Supabase.

## Process

1. **Cartographier** : identifier routes (`App.tsx` / Expo), auth requise, lecture seule vs écriture ; noter fichiers modifiés.
2. **Revue risques** : absence de `studioId` / `clientId` avant insert ; confiance aux données client (jamais pour paiement seul) ; double soumission ; états loading / vide / erreur ; fuites PII dans logs.
3. **Supabase** : tables `inkflow_*` cohérentes avec le schéma ; **RLS** — le client ne lit/écrit que ses lignes (voir `docs/SECURITY-AUDIT-RLS.md`) ; préférer RPC/`maybeSingle` documentés.
4. **UX** : mobile-first, cibles tactiles ≥ 44px, `useToast` pour succès/échec mutations, textes en français clair (pas de §).
5. **Implémentation** : changements **minimaux** ; réutiliser composants `components/ui`, patterns existants (`lib/supabase*`, `lib/client*`).
6. **Vérification** : `npm run typecheck` / `npm run build` si le repo l’expose ; lister scénarios de test manuels (happy path + hors ligne + refus permission).

## Reference Docs

- `reference.md` — Checklist étendue, périmètre web vs mobile, liens utiles.

## Rules

- Respecter les règles workspace InkFlow (Tailwind, `lucide-react`, pas de `any` gratuit).
- **Jamais** de clés secrètes en dur ; pas d’élargissement RLS « pour aller vite ».
- Ne pas mélanger parcours **dashboard tatoueur** et **app client** sans boundary clair (URLs, `user` role).
- Si la feature est ambiguë, proposer **une** option par défaut sûre + alternative documentée dans la PR.
