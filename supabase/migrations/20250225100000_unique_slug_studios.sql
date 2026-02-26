-- ============================================================
-- InkFlow: Slug unique par studio (multi-tenancy vitrines)
-- Résout : plusieurs tatoueurs avec le même slug → réservations
-- et vitrine partagées. Chaque studio doit avoir un slug UNIQUE.
-- ============================================================

-- 1. Corriger les doublons existants : pour chaque slug en double,
--    garder une ligne inchangée et rendre les autres uniques (suffixe).
WITH duplicates AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) AS rn
  FROM inkflow_studios
)
UPDATE inkflow_studios s
SET slug = s.slug || '-' || substr(md5(s.id), 1, 6)
FROM duplicates d
WHERE s.id = d.id AND d.rn > 1;

-- 2. Contrainte UNIQUE sur slug (une seule vitrine par slug)
ALTER TABLE inkflow_studios
  DROP CONSTRAINT IF EXISTS inkflow_studios_slug_key;

ALTER TABLE inkflow_studios
  ADD CONSTRAINT inkflow_studios_slug_key UNIQUE (slug);
