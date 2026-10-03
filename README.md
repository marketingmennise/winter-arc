# Winter Arc for Android

A personal Android habit tracker for Rutvik's 90-day Winter Arc. React is bundled inside Capacitor; the app works with a local phone copy and native Android notifications.

## What is included

- Daily habits, prayer counters, weekly commitments, journal, progress, and editable goals.
- A charcoal and lime launch screen and Android icon.
- Native movement and water reminders every 30 minutes during configurable desk hours (default 09:00–18:00, every day).
- One combined notification when both reminder types are enabled; no reminders outside the chosen hours.
- Phone storage and manual JSON backup import/export.

## Data and privacy

**The Android app keeps a separate local copy. It does not automatically sync with the private web tracker.** It begins with an unchecked routine. To move progress from the web app, export a web backup, transfer that JSON to the phone, and use Settings → Import backup. Import replaces the phone copy after explicit confirmation. Export your current phone backup first.

The existing private web tracker can be opened in your normal browser from Settings. Sign in there normally. No access token or account credential is included in this Android project. Do not make the web tracker public to connect the app.

Android automatic cloud backup is disabled. Use the app's JSON backup feature before uninstalling or clearing storage. Keep exported backups private: they include journal entries and habit history.

## Install the provided APK

Open `winter-arc-android-debug.apk` on your Android phone. If prompted, allow installation from the app you used to open it. This is a debug-signed personal build, not a Play Store release. Android 7 (API 24) or later and an updated Android System WebView are required.

Open Settings → Gentle desk reminders → Enable reminders. Android 13+ will ask for notification permission. Use Send test to check delivery. Notifications are approximate: battery-saving settings, Doze, a force-stop, or a locked Private Space can delay or stop delivery. The app does not request special exact-alarm access. Pause reminders disables all scheduled desk prompts until you enable them again. A reminder is not an instruction to drink a fixed amount each time.

## Build locally

Prerequisites: Node 24, JDK 21, Android SDK platform 36/build-tools 36.0.0. Android Studio Otter (2025.2.1) or newer includes compatible tooling. Configure `ANDROID_HOME` and `JAVA_HOME` for your installation.

```sh
npm ci
npm run sync
cd android
./gradlew :app:assembleDebug
```

Windows: use `gradlew.bat :app:assembleDebug` from the `android` directory. Output: `android/app/build/outputs/apk/debug/app-debug.apk`. The `android` folder can also be opened directly in Android Studio.

The included GitHub Actions workflow produces a downloadable debug APK after pushing this folder's contents to a repository or running Build Android APK manually. A release for the Play Store needs your own protected signing key, release build and store submission; this project does not publish anything automatically.

## Development

```sh
npm run dev
npm run build
npm run sync
```

Browser preview shows the local tracker, while native reminders are available only in Android. The Android app makes no `/api/tracker` requests and contains no remote `server.url` WebView configuration.

Pinned major versions: Capacitor 8.5.2, Local Notifications 8.3.1, React 19.2.6, Vite 8.3.2, Android compile/target SDK 36, Gradle 8.14.3. Node modules and generated build directories are intentionally excluded from the source ZIP.

## Updating this personal build

The provided APK is signed with a debug key. A later build made on another computer or GitHub Actions can use a different debug key, so Android may refuse to install it over the current app. **Export and save your JSON backup before uninstalling or reinstalling.** For dependable updates, configure your own consistent signing key and keep it private; never commit a release keystore or its password to GitHub.

## Verification

The bundled frontend passed TypeScript checking and a Vite production build. Backup validation/ordered-write tests and reminder schedule checks passed. The Android debug build compiled successfully. Its APK signature, minimum Android version, and merged permissions were inspected. Native reminder delivery and installation have not been tested on a physical Android phone or emulator; use Settings → Send test after installation.

The source seed contains the configured routine but no personal completion history or journal entries. GitHub Actions runs the backup and reminder tests before building the APK.
