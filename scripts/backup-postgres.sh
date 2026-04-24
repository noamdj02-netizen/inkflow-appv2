#!/usr/bin/env bash
# Dump Postgres (ex. Supabase) → fichier horodaté compressé.
# Ne jamais committer DATABASE_URL : l’exporter dans l’environnement ou un fichier .env local ignoré par git.
#
# Usage :
#   export DATABASE_URL='postgresql://postgres:***@db.xxx.supabase.co:5432/postgres'
#   ./scripts/backup-postgres.sh
#
# Optionnel : OUT_DIR=./backups  FORMAT=custom  (voir ci-dessous)
#
# Upload hors site (exemples, à lancer après coup) :
#   aws s3 cp ./inkflow-pg-*.sql.gz s3://mon-bucket/backups/inkflow/
#   rclone copy ./inkflow-pg-*.sql.gz remote:inkflow-backups/

set -euo pipefail

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump introuvable. Installez PostgreSQL client (ex. brew install libpq && brew link --force libpq)." >&2
  exit 1
fi

: "${DATABASE_URL:?Définir DATABASE_URL (chaîne de connexion Postgres, non versionnée)}"

OUT_DIR="${OUT_DIR:-.}"
FORMAT="${FORMAT:-sql}" # sql | custom
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT_DIR"

if [[ "$FORMAT" == "custom" ]]; then
  DEST="${OUT_DIR}/inkflow-pg-${TIMESTAMP}.dump"
  pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" -f "$DEST"
  echo "OK : ${DEST} (pg_restore -d ... ${DEST})"
else
  DEST="${OUT_DIR}/inkflow-pg-${TIMESTAMP}.sql.gz"
  pg_dump --no-owner --no-acl "$DATABASE_URL" | gzip -c >"$DEST"
  echo "OK : ${DEST}"
fi

echo "Pensez à copier l’artefact vers un stockage externe (S3, GCS, etc.). Voir docs/BACKUP-RECOVERY-DR.md"
