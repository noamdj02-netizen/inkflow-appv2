# Marque les migrations déjà présentes sur la base distante comme "applied"
# pour que "supabase db push" n'essaie pas de les réexécuter.
# À lancer depuis la racine du projet : .\scripts\supabase-repair-migration-history.ps1

$versions = @(
  "20250218000000",
  "20250219000000",
  "20250220000000",
  "20250225100000",
  "20250226000000",
  "20250226100000",
  "20250227100000",
  "20250227200000",
  "20250227210000",
  "20250301000000",
  "20250301100000",
  "20250301120000",
  "20250301150000",
  "20250302000000",
  "20250302100000",
  "20250308000000",
  "20250308000001"
)

foreach ($v in $versions) {
  Write-Host "Repair: $v => applied"
  npx supabase migration repair $v --status applied --linked
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Repair failed for $v (maybe already applied)"
  }
}

Write-Host ""
Write-Host "Done. Run: npx supabase db push"
Write-Host "Only 20250308100000 and 20250309000000 will be applied."
