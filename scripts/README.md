build_and_install_android.ps1

Purpose

This helper script attempts to automate building a release APK (locally via Gradle) and installing it on a connected Android device via adb. It's designed to run from the project root.

What it does

- Detects Java and JAVA_HOME
- Detects adb (platform-tools) and attempts to add common platform-tools paths to PATH for the session
- If Java and the Android gradle wrapper exist, runs `gradlew.bat assembleRelease` to produce a release APK/AAB
- Locates the latest release APK/AAB and attempts to install it on any connected device using `adb install -r`
- If local build isn't possible, prints step-by-step EAS cloud build instructions for Expo projects

Usage

Open PowerShell as Administrator (recommended) and run from the project root (E:\obbo):

    # from project root
    .\scripts\build_and_install_android.ps1

Options:

    -SkipBuild    # skip local Gradle build (useful if you already have an artifact)
    -GradleTask   # custom Gradle task, default: assembleRelease

Examples:

    .\scripts\build_and_install_android.ps1
    .\scripts\build_and_install_android.ps1 -SkipBuild
    .\scripts\build_and_install_android.ps1 -GradleTask assembleRelease

Troubleshooting

- "Java not found" / "JAVA_HOME is not set": install a JDK (Temurin/AdoptOpenJDK) and set JAVA_HOME to the JDK folder.
- "adb not found": Install Android SDK platform-tools and add the folder containing `adb.exe` to your PATH.
- "No devices found": enable Developer Options on your phone, enable USB debugging and accept the PC's RSA fingerprint prompt. Run `adb devices` to verify.
- Consider using EAS cloud build for an easier path if you're using Expo (no local Android SDK required). The script prints EAS build steps if local build fails.

Notes

This script is a helper to automate common steps. It cannot install if your machine lacks Java, Android SDK, or a connected device. If you prefer, use `eas build` and download the final artifact.
