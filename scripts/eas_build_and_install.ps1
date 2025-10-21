<#
EAS cloud build + install helper

What it does:
- Ensures `eas` CLI exists (offers to install globally if missing)
- Runs `eas login` (interactive) so you can authenticate
- Starts an EAS preview build: `eas build -p android --profile preview` (interactive)
- After the build completes, you'll get a download URL in the EAS web UI or terminal. Paste that URL when prompted.
- The script will download the APK/AAB and attempt to install it via `adb install -r` if adb is available.

Usage (run from project root E:\obbo):
    .\scripts\eas_build_and_install.ps1

Notes:
- You must have Node/npm available to install eas-cli if it's missing.
- `eas login` is interactive and may open a browser.
- The script cannot bypass the EAS interactive build status if your account requires 2FA or a browser login.
#>

function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err($m){ Write-Host "[ERROR] $m" -ForegroundColor Red }

# Ensure running from repo root (where package.json exists)
$cur = Get-Location
if (-not (Test-Path (Join-Path $cur 'package.json'))) {
    Write-Warn "package.json not found in current folder. Please run this script from the project root (E:\obbo)."
    return
}

# 1) Check EAS CLI
$easCmd = Get-Command eas -ErrorAction SilentlyContinue
if ($null -eq $easCmd) {
    Write-Warn "EAS CLI not found. Install globally now? (requires npm and network) [Y/N]"
    $resp = Read-Host
    if ($resp -match '^[Yy]') {
        Write-Info "Installing eas-cli globally (may require admin privileges)..."
        try {
            npm install -g eas-cli | Out-Host
            $easCmd = Get-Command eas -ErrorAction SilentlyContinue
            if ($null -eq $easCmd) { Write-Err "eas-cli installation failed or not on PATH."; return }
        } catch {
            Write-Err "Installation failed: $_"; return
        }
    } else {
        Write-Err "eas-cli is required for cloud builds. Aborting."; return
    }
} else {
    Write-Info "Found eas CLI: $($easCmd.Source)"
}

# 2) Login (interactive)
Write-Info "Running 'eas login' (interactive). If a browser opens, complete the login."
& eas login
if ($LASTEXITCODE -ne 0) {
    Write-Warn "eas login returned exit code $LASTEXITCODE. If not logged in, run 'eas login' manually and re-run this script."; 
}

# 3) Start build
Write-Info "Starting EAS preview build. This will run in your account and may take several minutes."
Write-Info "If you're asked questions, respond in the terminal."
& eas build -p android --profile preview
Write-Info "eas build command finished (or was cancelled). If the build completed successfully, copy the artifact download URL (from the terminal output or EAS web dashboard)."

# 4) Ask user to paste artifact URL (or local path)
Write-Info "Paste the direct download URL of the APK/AAB (or local file path) and press Enter."
$artifactUrl = Read-Host
if (-not $artifactUrl) { Write-Err "No URL provided. Exiting."; return }

# If it's a URL, download it
$localPath = $null
if ($artifactUrl -match '^https?://') {
    try {
        $fn = [System.IO.Path]::GetFileName($artifactUrl.Split('?')[0])
        if (-not $fn) { $fn = 'app.apk' }
        $out = Join-Path $env:TEMP $fn
        Write-Info "Downloading artifact to $out ..."
        Invoke-WebRequest -Uri $artifactUrl -OutFile $out -UseBasicParsing -Verbose
        $localPath = $out
        Write-Info "Downloaded to $localPath"
    } catch {
        Write-Err "Failed to download artifact: $_"; return
    }
} elseif (Test-Path $artifactUrl) {
    $localPath = (Resolve-Path $artifactUrl).Path
    Write-Info "Using local file: $localPath"
} else {
    Write-Err "Provided string is neither a downloadable URL nor a local file path."; return
}

# 5) Install via adb if possible
$adb = Get-Command adb -ErrorAction SilentlyContinue
if ($null -eq $adb) {
    Write-Warn "adb not found in PATH. Attempt to add common platform-tools to PATH? [Y/N]"
    $r = Read-Host
    if ($r -match '^[Yy]') {
        $possible = @(
            "$env:LOCALAPPDATA\Android\Sdk\platform-tools",
            "$env:ProgramFiles\Android\Android Studio\platform-tools",
            "$env:ProgramFiles(x86)\Android\platform-tools",
            "C:\platform-tools"
        )
        foreach ($p in $possible) { if (Test-Path $p) { $env:PATH = "$p;$env:PATH"; break } }
        $adb = Get-Command adb -ErrorAction SilentlyContinue
    }
}

if ($null -eq $adb) {
    Write-Err "adb still not found. You can manually install the downloaded artifact using: adb install -r `"$localPath`""
    return
}

Write-Info "Listing connected devices..."
& adb devices | Out-Host
Write-Info "Installing APK/AAB to first connected device..."
try {
    & adb install -r "$localPath" | Out-Host
    if ($LASTEXITCODE -eq 0) { Write-Info "Install command finished. Check your device for the app." } else { Write-Warn "adb install exited with code $LASTEXITCODE" }
} catch {
    Write-Err "adb install failed: $_"
}

Write-Info "Done."