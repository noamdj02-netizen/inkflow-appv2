#!/usr/bin/env bash
# Redimensionne Chrome pour captures InkFlow (ratio 16:10).
# Usage: ./scripts/screenshot-viewport.sh [1280x800|1440x900|2560x1600|2880x1800]
# Prérequis: serveur local → npm run dev (http://localhost:3000)

set -euo pipefail

PRESET="${1:-1440x900}"
URL="${SCREENSHOT_URL:-http://localhost:3000/}"
BROWSER="${SCREENSHOT_BROWSER:-Google Chrome}"

case "$PRESET" in
  1280x800 | 1280)  W=1280; H=800 ;;
  1440x900 | 1440)  W=1440; H=900 ;;
  2560x1600 | 2560) W=2560; H=1600 ;;
  2880x1800 | 2880) W=2880; H=1800 ;;
  list)
    echo "Presets 16:10 disponibles:"
    echo "  1280x800   — léger / preview"
    echo "  1440x900   — défaut recommandé"
    echo "  2560x1600  — Retina / marketing HD"
    echo "  2880x1800  — MacBook Pro 15\" natif"
    exit 0
    ;;
  *)
    echo "Preset inconnu: $PRESET" >&2
    echo "Utilise: 1280x800 | 1440x900 | 2560x1600 | 2880x1800 | list" >&2
    exit 1
    ;;
esac

osascript <<APPLESCRIPT
tell application "$BROWSER"
  activate
  if (count of windows) = 0 then
    make new window
  end if
  set URL of active tab of window 1 to "$URL"
  set bounds of window 1 to {0, 0, $W, $H}
end tell
APPLESCRIPT

echo "✓ $BROWSER → ${W}×${H}px — $URL"
echo "  Capture: Cmd+Shift+4 puis Espace sur la fenêtre."
