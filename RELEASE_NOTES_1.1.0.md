## Task-aware ringing alarms

Download **winter-arc-v1.1.0.apk** and open it on Android 7 or newer.

- Full-screen task title and instructions, repeating alarm sound and vibration.
- Dismiss, 5-minute snooze, and auto-silence after 5 minutes.
- Pick a habit and alarm time, or a project task with a planned date.
- Completed items on this phone are skipped; habits follow their scheduled days within your arc.
- Optional ringing desk/water alarms every 30 minutes during your chosen hours.
- Alarm permission setup, volume shortcut, and test button in Settings.

**Setup:** Settings → Task alarms → allow Notifications, On-time alarms, and Full-screen access → Test ringing → Add task alarm. For loud desk prompts, select Full-screen alarm under Desk reminders.

Android can show a banner while unlocked; full-screen access is needed over the lock screen. Alarm volume, Do Not Disturb, battery limits, and force-stop affect delivery. No alarms ring with the phone powered off. This debug-signed personal preview passed compilation and automated scheduling tests; physical-phone and locked-screen behavior has not been verified. Set a near-future test alarm on your phone before relying on it.

**Updating:** Export your tracker JSON backup first. This build may use a different debug signing key from v1.0.0. If Android rejects the update, uninstall the old version only after saving your backup, install this APK, and import the backup. Alarm schedules are separate and must be set up again after reinstalling.
