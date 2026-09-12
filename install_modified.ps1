# Claude Arabic Terminal — one-shot installer for Windows (PowerShell).
#   irm https://raw.githubusercontent.com/JamalMohafil/claude-arabic-terminal/main/install.ps1 | iex
$ErrorActionPreference = "Stop"

$Repo   = "https://github.com/JamalMohafil/claude-arabic-terminal.git"
$Dir    = if ($env:CLAUDE_ARABIC_DIR) { $env:CLAUDE_ARABIC_DIR } else { Join-Path $env:USERPROFILE ".claude-arabic-terminal" }
$ExtDir = Join-Path $env:USERPROFILE ".vscode\extensions"
$BinDir = Join-Path $env:USERPROFILE ".local\bin"

function Say($m)  { Write-Host "> $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "OK $m" -ForegroundColor Green }
function Fail($m) { Write-Host "X $m" -ForegroundColor Red; exit 1 }

# --- prerequisites ---------------------------------------------------------
if (-not (Get-Command git  -ErrorAction SilentlyContinue)) { Fail "git is required (https://git-scm.com)." }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fail "Node.js 18+ is required (https://nodejs.org)." }
if (-not (Get-Command npm  -ErrorAction SilentlyContinue)) { Fail "npm is required (comes with Node.js)." }
# Claude Code check removed for installation in Claude Code agent environment

if (-not (Test-Path $ExtDir)) { Fail "VS Code extensions folder not found at $ExtDir - is VS Code installed?" }
$nodeMajor = [int](node -p "process.versions.node.split('.')[0]")
if ($nodeMajor -lt 18) { Fail "Node.js 18+ required (found $(node -v))." }

# --- fetch / update --------------------------------------------------------
if (Test-Path (Join-Path $Dir ".git")) {
  Say "Updating existing install in $Dir"
  git -C $Dir pull --ff-only --quiet
} else {
  Say "Cloning into $Dir"
  git clone --quiet --depth 1 $Repo $Dir
}

# --- dependencies ----------------------------------------------------------
Say "Installing dependencies (node-pty, @xterm/headless)"
Push-Location $Dir
try { npm install --omit=dev --no-audit --no-fund --loglevel=error } finally { Pop-Location }

# --- register the VS Code extension ---------------------------------------
$version = node -p "require('$($Dir -replace '\\','/')/package.json').version"
Get-ChildItem $ExtDir -Filter "jamal.claude-arabic-terminal-*" -ErrorAction SilentlyContinue | ForEach-Object {
  if ($_.LinkType) { $_.Delete() } else { Remove-Item $_.FullName -Recurse -Force }
}
$link = Join-Path $ExtDir "jamal.claude-arabic-terminal-$version"
New-Item -ItemType Junction -Path $link -Target $Dir | Out-Null
Ok "Extension linked: $link"

# --- the `arabic` launcher -------------------------------------------------
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
Copy-Item (Join-Path $Dir "bin\arabic.cmd") (Join-Path $BinDir "arabic.cmd") -Force
Copy-Item (Join-Path $Dir "bin\arabic.ps1") (Join-Path $BinDir "arabic.ps1") -Force
Ok "Launcher installed: $BinDir\arabic.cmd"

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (($userPath -split ";") -notcontains $BinDir) {
  [Environment]::SetEnvironmentVariable("Path", "$userPath;$BinDir", "User")
  $env:Path += ";$BinDir"
  Say "Added $BinDir to your user PATH (open a new terminal for it to take effect)."
}

Write-Host ""
Write-Host "Claude Arabic Terminal is installed." -ForegroundColor Green
Write-Host @"

Next steps:
  1. In VS Code: Ctrl+Shift+P -> "Developer: Reload Window"
  2. In any VS Code terminal, run:

       arabic claude

     Any Claude Code flag passes through, e.g.:
       arabic claude --dangerously-skip-permissions
       arabic claude --resume

  3. The first time, VS Code asks "Allow 'Claude Arabic Terminal' to open this URI?"
     -> tick "Do not ask me again" and click Open.

Claude Code then runs in an Arabic-capable pane inside the VS Code terminal area.
"@
