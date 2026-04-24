#!/usr/bin/env bash
# P0.1 — refuse service role / service_role exposure in Vite client tree
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

search() {
  local dir="$1"
  [ -d "$dir" ] || return 0
  if grep -rE \
    'SUPABASE_SERVICE_ROLE|VITE_[A-Z0-9_]*SERVICE_ROLE' \
    --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
    "$dir" 2>/dev/null; then
    return 1
  fi
  return 0
}

for d in lib pages components hooks; do
  if ! search "$ROOT/$d"; then
    echo ""
    echo "P0.1 fail: pattern above in $ROOT/$d"
    FAIL=1
  fi
done

if [ "$FAIL" -ne 0 ]; then
  exit 1
fi
echo "P0.1 client tree: no SERVICE_ROLE / leaked service key patterns (lib, pages, components, hooks)."
