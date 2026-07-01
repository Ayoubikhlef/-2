$schema = "$PSScriptRoot\prisma\schema.prisma"
$content = Get-Content $schema -Raw
if ($content -match 'provider = "postgresql"') {
  $content = $content -replace 'provider = "postgresql"', 'provider = "sqlite"'
  Set-Content $schema $content
  Write-Host "[OK] Switched to SQLite for local development"
  Write-Host "Run: cd server && npm run db:push && npm run dev"
} else {
  Write-Host "[Already] Schema is already SQLite"
}
