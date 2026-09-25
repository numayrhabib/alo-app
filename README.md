# Alo — load shedding alerts for Bangladesh

Android app (Expo / React Native). Bangla and English, dark mode, banner ads only.

- `app/` — the app's code. `app/src/config.js` holds the settings you may change later (ad unit ID, crowd reports server).
- Every change to `app/` builds a new test APK for free with GitHub Actions and publishes it here:
  **https://github.com/numayrhabib/alo-app/releases/download/test-build/alo-test.apk**
- Official schedules come from the separate `alo-data` repository.
- `supabase.sql` — one-time setup for the free crowd reports database.
