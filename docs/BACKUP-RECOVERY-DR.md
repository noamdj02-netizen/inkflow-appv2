# Backups, reprise et incidents (P0.5)

Ce document complète les sauvegardes **managées par Supabase** par une **copie hors plateforme**, un **test de restauration tracé**, et des **réflexes incident** courts. Rien de remplace un exercice annuel (au minimum une fois) avec date et prénom inscrits.

**Distinction utile** : l’export RGPD par studio (`export-studio-gdpr` côté app) sert à la **portabilité légale**, pas à reconstruire toute la base pour un sinistre multi-clients. Pour cela, viser un **dump Postgres** ou le flux PITR / restauration Supabase.

**Références Supabase (à jour) :** [Sauvegardes](https://supabase.com/docs/guides/platform/backups) · [Point-in-Time Recovery (PITR)](https://supabase.com/docs/guides/platform/backups#point-in-time-recovery) — les durées de rétention (ex. 7 j / 28 j) dépendent **du plan et de l’offre au moment T** : vérifier le dashboard du projet et [tarifs](https://supabase.com/pricing).

---

## 1. PITR et sauvegardes managées (checklist)

Actions à refaire **après** tout changement de plan ou d’environnement (prod / staging).

| #   | Vérification                                                                                                                                                        | OK  | Date (AAAA-MM-JJ) | Par qui |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ----------------- | ------- |
| 1.1 | Le projet **production** a les sauvegardes / PITR attendues selon l’**offre souscrite** (voir dashboard → **Settings** → **Add-ons** / **Database** → **Backups**). | [ ] |                   |         |
| 1.2 | Rétention et procédure de **restore** comprises par au moins **deux** personnes de l’équipe.                                                                        | [ ] |                   |         |
| 1.3 | Coût et alertes facturation revus (PITR / stockage = ligne budgétaire).                                                                                             | [ ] |                   |         |

**Rappel** : ce qui est en ligne dans Supabase n’est **pas** une copie « ailleurs ». La section 2 sert de diversification.

---

## 2. Export hebdomadaire « hors site » (SQL/JSON, stockage externe)

**Objectif** : en plus des backups hébergeur, une copie **dans un autre sceau** (S3, GCS, stockage d’équipe chiffré, _pas_ uniquement le même hébergeur que l’app).

**Fréquence** : hebdo (ex. chaque **dimanche** 06:00) — calendrier ou rappel partagé.

**Contenu** : de préférence un **dump logique** Postgres (`.sql.gz` ou format custom `pg_dump -Fc`).

1. Récupérer la **connection string** (rôle `postgres` ou rôle de backup) : Supabase **Project Settings → Database** (URI, éventuellement _direct_ pour gros schémas).
2. Exporter en local (rapide) : `bash scripts/backup-postgres.sh` — voir le script (variable `DATABASE_URL` **dans l’environnement uniquement**).
3. Uploader l’artefact vers le stockage choisi, avec **chemin horodaté** (ex. `inkflow-pg-2026-04-23-Fc.gz`).
4. Rétention côté stockage (ex. garder 8 semaines glissantes, puis supprimer le plus vieux) — règle interne.

**Option automatisation** : `cron` sur une machine sûre, **GitHub Actions** `on: schedule` avec secrets de repo, ou n8n. Ne **jamais** committer d’URL avec mot de passe.

---

## 3. Test de restauration (obligatoire — au moins une fois, puis périodique)

Un backup non testé n’est **pas** un backup. Le premier test peut être sur un **nouveau projet** Supabase, une **branche** base si disponible, ou une machine avec Postgres (restore du dump) — **pas** d’abord en prod.

### Billet de preuve (modèle)

| Champ                                                          | Valeur |
| -------------------------------------------------------------- | ------ |
| Date (AAAA-MM-JJ)                                              |        |
| Exécutant                                                      |        |
| Environnement cible (staging / branche / nouveau projet)       |        |
| Source (snapshot Supabase, fichier dump `*.gz`, autre)         |        |
| Résultat (OK / écart)                                          |        |
| Vérification minimale (ex. requêtes, connexion app en staging) |        |
| Leçon / suivi d’action                                         |        |

**Règles** : noter dès que possible une **re-démonstration** (ex. annuelle) en dupliquant une ligne dans un tableau historique (au verso du doc ou wiki).

---

## 4. Runbook incident (réflexes)

### Supabase (base, Auth, Storage, Edge) indisponible ou dégradé

- Consulter [https://status.supabase.com](https://status.supabase.com) et le statut de **ton** région.
- **Ne pas** lancer de migrations / changements de schéma en plein incident. Préférer message utilisateurs (page statique ou bannière) et lecture seule si l’app le permet.
- Rappeler que **Stripe** et le **front Vercel** peuvent continuer à répondre : isoler l’origine (DNS, CORS, `VITE_SUPABASE_URL`).

### Stripe (paiements, webhooks) indisponible ou en erreur

- Consulter [https://status.stripe.com](https://status.stripe.com). Éviter les **déploiements** qui touchent les **webhooks** ou les clés en plein milieu d’incident.
- Paiements en file : rassurer, ne pas forcer de doubles débits ; journaliser côté support les sessions bloquées.

### Vercel (front / CDN) indisponible

- Consulter [https://www.vercel-status.com](https://www.vercel-status.com). L’API (Supabase) et **Stripe** restent ailleurs : vérifier si l’outage n’est que le front.
- Si un **origine de secours** (domaine, hébergeur) est préméditée (DNS, bascule), l’appliquer selon le runbook interne (hors de ce document si non retenu).

---

## 5. Liens internes

- Authentification et limites côté app : [AUTH-HARDENING.md](AUTH-HARDENING.md)
- Variables d’environnement : [ENV-PRODUCTION.md](ENV-PRODUCTION.md)
- Checklist go-live (pointeur) : [CHECKLIST-PRODUCTION.md](CHECKLIST-PRODUCTION.md)
