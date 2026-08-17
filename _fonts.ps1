$ErrorActionPreference = 'Stop'
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
$url = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700&display=swap"
$css = (Invoke-WebRequest -Uri $url -Headers @{ "User-Agent" = $ua }).Content
$outDir = "public/fonts"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$blocks = [regex]::Matches($css, "@font-face\s*{[^}]+}")
$count = 0
$lines = @()
foreach ($b in $blocks) {
  $blk = $b.Value
  $family = ([regex]::Match($blk, "font-family:\s*'([^']+)'")).Groups[1].Value
  $weight = ([regex]::Match($blk, "font-weight:\s*(\d+)")).Groups[1].Value
  $range = ([regex]::Match($blk, "unicode-range:\s*([^;]+)")).Groups[1].Value.Trim()
  $file = ([regex]::Match($blk, "url\((\S+?)\)")).Groups[1].Value
  $subset = if ($range -match 'U\+0600|U\+060[0-9A-F]|U\+06[1-9A-F][0-9A-F]|U\+0750|U\+08A0|U\+FB50|U\+FE70|U\+200C-200F|U\+2500-25EF|U\+2600-26BE') { 'arabic' }
            elseif ($range -match 'U\+0000-00FF') { 'latin' }
            elseif ($range -match 'U\+0100-02BA') { 'latin-ext' }
            else { 'other' }
  if ($family -eq 'Plus Jakarta Sans' -and $subset -eq 'other') { continue }
  $name = ($family -replace ' ', '-').ToLower()
  $fname = "$name-$weight-$subset.woff2"
  Invoke-WebRequest -Uri $file -OutFile "$outDir/$fname" -Headers @{ "User-Agent" = $ua }
  $size = (Get-Item "$outDir/$fname").Length
  $lines += "@font-face {`n  font-family: '$family';`n  font-style: normal;`n  font-weight: $weight;`n  font-display: swap;`n  src: url('/fonts/$fname') format('woff2');`n  unicode-range: $range;`n}"
  $count++
  Write-Output "OK $fname ($([Math]::Round($size/1024))KB)"
}
$lines | Set-Content -Path "src/styles/fonts.css" -Encoding utf8
Write-Output "TOTAL FILES: $count"