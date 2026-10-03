# Winter Arc Generic

An offline-first Android habit tracker for a fresh 90-day arc. The generic edition includes eight editable starter habits, daily check-ins, weekly planning, progress views, optional goals, JSON backups, reminders and native alarms.

## Start using it

Download `winter-arc-generic-v1.2.0.apk` from [Releases](https://github.com/marketingmennise/winter-arc/releases/tag/v1.2.0-generic). Android may ask you to allow installation from the app used to download it. This is a debug-signed preview APK, not a Play Store release.

The arc begins on your first launch using your phone's local date. In Settings, edit your name, start date and routine. Add your own habits and optional goals; weekly projects start empty. All habits are suggestions and can be renamed, rescheduled or switched off.

## Generic edition and privacy

- Application ID: `com.winterarc.tracker`; app label: **Winter Arc Generic**.
- Installs independently of the personal edition and does not read its app storage.
- Includes no personal name, company projects, religious routine, private goals or completion history.
- Data stays in local app storage. There is no account, cloud database or automatic cloud sync.
- Export backups from Settings before uninstalling or changing phones. Import only a backup you intend to use; imports replace the current tracker.
- The personal edition remains available on `main`, the `personal-v1.1` branch and its existing release.

## Alarms and reminders

Create an alarm and optionally link it to a habit or project task. Alerts use its title and instructions. Native alarms can ring and vibrate, with Dismiss and five-minute Snooze actions. A full-screen alert can appear when Android permits it. Exact alarm, notification and full-screen permissions are configurable in Settings. Android, device settings and manufacturer battery restrictions may affect delivery; use the built-in Test alarm on your phone. Alarms use the phone's time zone. No alarm is enabled by default.

## Development

Requirements: Node.js 24, JDK 21 and Android SDK 36/build-tools 36.0.0.

```sh
npm ci
npm test
npm run dev
```

Build the Android package:

```sh
npm run sync
cd android
./gradlew :app:assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`.

The generic source lives on the `generic` branch. GitHub Actions tests the app, builds the APK, and publishes the versioned generic preview release with a SHA-256 checksum. Existing release assets are left unchanged. Bump the Android version and workflow release tag for a subsequent release.
