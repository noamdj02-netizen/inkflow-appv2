#!/usr/bin/env bash
# Colle les 6 price IDs Stripe TEST dans les secrets Edge Supabase (projet lié).
# Prérequis : supabase login + supabase link ; STRIPE_SECRET_KEY=sk_test_… déjà en secret.
# Voir FIXES-PRICING-FINAL-2026-08-07.md

set -euo pipefail

cd "$(dirname "$0")/.."

if ! supabase projects list 2>/dev/null | grep -q '●'; then
  echo "Erreur : aucun projet Supabase lié. Lance supabase link d'abord."
  exit 1
fi

echo "→ Mise à jour des secrets STRIPE_PRICE_* (mode TEST) sur le projet lié…"

supabase secrets set \
  STRIPE_PRICE_SOLO_MONTHLY=price_1U1rLc5JVD1yZUQvCUjoA00X \
  STRIPE_PRICE_SOLO_ANNUAL=price_1U1rLc5JVD1yZUQvyEnJ1Ae5 \
  STRIPE_PRICE_PRO_MONTHLY=price_1U1rLd5JVD1yZUQviBCz7ltF \
  STRIPE_PRICE_PRO_ANNUAL=price_1U1rLd5JVD1yZUQv5s4gR3Yk \
  STRIPE_PRICE_STUDIO_MONTHLY=price_1U1rLe5JVD1yZUQvt9zMpeYv \
  STRIPE_PRICE_STUDIO_ANNUAL=price_1U1rLf5JVD1yZUQvxyVnRGY4

echo "✓ Secrets price IDs TEST appliqués."
echo "  Vérifie que STRIPE_SECRET_KEY est bien sk_test_… (Dashboard → Edge Functions → Secrets)."
echo "  Smoke : checkout Essentiel depuis le dashboard → webhook → inkflow_subscriptions.plan = solo"
