-- Historique distant uniquement : cette version était déjà enregistrée sur le projet Supabase
-- sans fichier dans le dépôt. Fichier ajouté pour aligner `supabase migration list` / `db push`.
-- No-op idempotent (schéma déjà présent sur la base distante au moment de l’alignement).
SELECT 1;
