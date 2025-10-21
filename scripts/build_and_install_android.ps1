<#
PowerShell helper: build_and_install_android.ps1

What it does:
- Checks Java (java -version) and JAVA_HOME
- Checks for adb and platform-tools
- If Java present and Android native folder found, runs Gradle to assemble release APK
- If APK found, tries to install it on a connected Android device via adb
- If local build isn't possible, prints EAS cloud build steps for Expo-managed app

Run from project root (E:\obbo) in an elevated PowerShell if necessary.
#>

Param(
    [switch]$SkipBuild,
    [string]$GradleTask = "assembleRelease"
)

function Write-Info($msg){ Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg){ Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg){ Write-Host "[ERROR] $msg" -ForegroundColor Red }

Push-Location (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent) | Out-Null
# Move to repo root
Set-Location ..
$RepoRoot = Get-Location
Write-Info "Repo root: $RepoRoot"

# 1) Check for Java
$java = Get-Command java -ErrorAction SilentlyContinue
if ($null -eq $java) {
    Write-Warn "Java not found in PATH. Checking JAVA_HOME..."
    if ($env:JAVA_HOME) {
        $javaPath = Join-Path $env:JAVA_HOME "bin\java.exe"
        if (Test-Path $javaPath) { Write-Info "Found java at $javaPath" } else { Write-Warn "JAVA_HOME set but java not found at $javaPath" }
    } else {
        Write-Warn "JAVA_HOME is not set. Local Gradle builds will likely fail."
    }
} else {
    try { & java -version 2>&1 | Out-String | Write-Host } catch { }
}

# 2) Check adb availability
$adb = Get-Command adb -ErrorAction SilentlyContinue
if ($null -eq $adb) {
    Write-Warn "adb not found in PATH. Attempting to locate common platform-tools locations..."
    $possible = @(
        "$env:LOCALAPPDATA\Android\Sdk\platform-tools",
        "$env:ProgramFiles\Android\Android Studio\platform-tools",
        "$env:ProgramFiles(x86)\Android\platform-tools",
        "C:\platform-tools",
        "C:\Android\platform-tools"
    )
    $foundPath = $null
    foreach ($p in $possible) {
        if (Test-Path $p) { $foundPath = $p; break }
    }
    if ($foundPath) {
        Write-Info "Found platform-tools at $foundPath. Adding to PATH for this session."
        $env:PATH = "$foundPath;$env:PATH"
        $adb = Get-Command adb -ErrorAction SilentlyContinue
    } else {
        Write-Warn "Could not find platform-tools automatically. If you have them, add to PATH or set ANDROID_HOME/ANDROID_SDK_ROOT."
    }
}

if ($null -eq $adb) {
    Write-Warn "adb not available. You won't be able to install APKs from this script."
} else {
    Write-Info "adb found: $($adb.Source)"
    Write-Info "Checking for connected devices..."
    $devices = & adb devices 2>&1 | Select-String -Pattern 'device$' -NotMatch | Out-String
    # Use adb devices parsing
    $adbDevicesRaw = & adb devices 2>&1 | Out-String
    Write-Host $adbDevicesRaw
}

# 3) Local Gradle build if android folder exists and Java available
$androidDir = Join-Path $RepoRoot 'android'
$gradleWrapper = Join-Path $androidDir 'gradlew.bat'
$apkPath = $null

if (-not $SkipBuild -and (Test-Path $androidDir) -and (Test-Path $gradleWrapper) -and (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Info "Attempting local Gradle release build in $androidDir"
    Push-Location $androidDir
    try {
        & .\gradlew.bat -v | Out-Host
        & .\gradlew.bat $GradleTask -PreactNativeDevServerPort=8081 2>&1 | Tee-Object -Variable gradleOut
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "Gradle task exited with code $LASTEXITCODE. See output above."
        } else {
            Write-Info "Gradle task completed. Searching for APK/AAB..."
            $apkCandidates = Get-ChildItem -Path . -Recurse -Include "*-release.apk","app-release.apk","*.aab" -ErrorAction SilentlyContinue
            if ($apkCandidates.Count -gt 0) {
                $apkPath = $apkCandidates | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Select-Object -ExpandProperty FullName
                Write-Info "Found artifact: $apkPath"
            } else {
                Write-Warn "No APK/AAB found in android build outputs."
            }
        }
    } catch {
        Write-Err "Gradle build failed: $_"
    } finally {
        Pop-Location
    }
} else {
    if ($SkipBuild) { Write-Info "Skipping local build as requested." }
    else { Write-Warn "Local Gradle build skipped because android/gradlew.bat or Java is missing." }
}

# 4) If artifact found and adb available, install
if ($apkPath -and (Get-Command adb -ErrorAction SilentlyContinue)) {
    Write-Info "Attempting to install $apkPath to connected device(s)"
    try {
        & adb install -r "$apkPath" 2>&1 | Out-Host
        if ($LASTEXITCODE -eq 0) { Write-Info "Installation command finished. Verify app on device." } else { Write-Warn "adb install returned exit code $LASTEXITCODE" }
    } catch {
        Write-Err "adb install failed: $_"
    }
    Write-Info "Done."
    Pop-Location
    exit 0
}

# 5) If no local artifact, print EAS cloud build instructions
Write-Warn "No local APK installed. Falling back to EAS cloud build instructions."

$easAdvice = @"
EAS cloud build (recommended for Expo-managed projects):

1) Install EAS CLI (if not): npm install -g eas-cli
2) Login: eas login
3) Initialize (if not): eas build:configure
4) Start a preview build: eas build -p android --profile preview
5) When the build finishes, you'll get a download URL. Download the .apk or .aab on your PC and then run:

    adb install -r <path-to-downloaded-apk>

Troubleshooting:
- If Java is missing and you want local builds, install a JDK (AdoptOpenJDK/Temurin 11 or 17) and set JAVA_HOME.
- Install Android SDK & platform-tools, and add platform-tools to PATH so `adb` is available.
- Ensure your Android device has USB debugging enabled and that you authorized the PC.

"@

Write-Host $easAdvice

Pop-Location

Write-Info "Script finished. If you want, re-run with -SkipBuild to skip local Gradle and only attempt installation of a previously built APK (pass -SkipBuild -GradleTask <taskName> to customize)."
