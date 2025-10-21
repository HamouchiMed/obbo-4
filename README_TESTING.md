README — How to build and share an Android APK (PowerShell)

This file contains exact PowerShell-ready steps to build an Android APK for the `obbo` app using Expo Application Services (EAS) and share it with testers.

Prerequisites
- Node.js & npm installed
- Expo CLI and EAS CLI installed (commands below)
- You have an Expo account (create one at https://expo.dev)
- Your project is committed and pushed to the branch you will build from

1) Install CLI tools (one-time)

```powershell
# install expo cli if needed
npm install -g expo-cli
# install eas cli
npm install -g eas-cli
```

2) Prepare the project (one-time or when native deps changed)

```powershell
cd D:\obbo
# install JS deps
npm install
# if you used any Expo native modules, install them via expo install
expo install expo-blur
```

3) Log in with EAS and Expo

```powershell
cd D:\obbo
eas login
# follow prompts
```

4) Start an Android preview build (APK)

```powershell
cd D:\obbo
# build with the 'preview' profile from eas.json
eas build -p android --profile preview
```
What to expect: EAS uploads your project and starts a cloud build. You will see a build URL in the terminal. Keep this terminal open or note the build id.

5) Check build status and get the APK URL

```powershell
# list recent builds
eas build:list
# view a specific build (or use the URL shown earlier)
# replace BUILD_ID with the id displayed during build
eas build:view BUILD_ID
```
When the build completes, the `eas build:view` output includes an artifacts URL (direct download to the APK). Copy that URL.

6) Share the APK with testers
Options:

- Direct: send the EAS artifact URL to testers (fastest). They can open the link on Android and install.
- GitHub Releases: download the APK locally and attach it to a release for versioned distribution.
- Google Drive / Dropbox: upload the APK and share a public link.

Example — download and upload to GitHub Release (optional)

```powershell
# download the apk (replace URL)
Invoke-WebRequest -Uri "https://expo.dev/artifacts/xxxx/app.apk" -OutFile ".\obbo-preview.apk"
# then use GitHub web UI or gh CLI to publish a release
# (requires gh CLI and authentication)
gh release create v0.1.0 .\obbo-preview.apk --title "Preview v0.1.0" --notes "Preview APK for testers"
```

Tester install notes
- On Android 8+ they may need to allow installing unknown apps for the browser or file manager used to open the APK.
- If they see an "App not installed" error, ask for the exact Android version and a screenshot.

Troubleshooting
- Build fails with native module errors: ensure you've run `expo install <module>` locally and committed any config changes (e.g., `app.json` / `app.config.js`).
- Build fails with credentials problems: run `eas build` again and follow prompts to set up credentials or use the EAS dashboard.
- If the APK crashes at runtime: open the Android Logcat (or ask tester for the error) and check the backend endpoints.

Pointing the app to your backend
- Option A (quick): Edit `utils/config.js` to set the API base URL and commit. Re-run the EAS build.
- Option B (env): Add `EXPO_PUBLIC_API_BASE` to `eas.json` under the `preview` profile's `env` block and rebuild. Example:

  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_BASE": "https://api.yoursite.com"
      }
    }
  }

Finish
- After you get the artifact link, share it with your client. If you'd like, I can add the `EXPO_PUBLIC_API_BASE` env placeholder to `eas.json` now or create a short email template to send to testers.
