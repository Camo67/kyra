# Android APK Build Guide (Capacitor)

This project already ships with Capacitor wiring, so you can wrap the Next.js UI in a native Android shell without touching Flutter. Follow these steps from the repo root.

## 1. Prerequisites

- Node.js + npm for the Next.js build.
- Java 17, Android Studio, and the Android SDK (already configured earlier).
- A running backend URL that the WebView should hit. During emulator testing `http://10.0.2.2:3000` proxies back to your host machine, while production builds should point at a public domain.

## 2. Build the web assets and sync Capacitor

```bash
# install JS deps once
npm install

# optional: override the server URL for the embedded WebView
export CAP_SERVER_URL="https://your.production.domain"

# compile Next.js and copy assets into android/
npm run android:sync
```

Under the hood this runs `next build` and `npx cap sync android`, which refreshes `android/app/src/main/assets/public` plus keeps native plugins aligned with `package.json`.

## 3. Open / build the Android project

### Debugging quickly

```bash
npx cap open android               # launches Android Studio
# or headless:
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Keep the Next.js dev server running (`npm run dev`) so the WebView can load `http://10.0.2.2:3000`.

### Generating a release APK

```bash
cd android
./gradlew assembleRelease
```

Artifacts land in `android/app/build/outputs/apk/release/`. The file is `app-release-unsigned.apk` until you sign it.

## 4. Sign the APK (Play Store / distribution)

```bash
keytool -genkeypair -v -keystore kira.keystore -alias kira \
  -keyalg RSA -keysize 2048 -validity 10000

# store env vars or use gradle.properties to reference the keystore

./gradlew assembleRelease               # now emits a signed AAB/APK if configured
# or sign manually
apksigner sign --ks kira.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk
```

Verify with:

```bash
apksigner verify --print-certs app/build/outputs/apk/release/app-release.apk
```

## 5. Install on device

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

Android may prompt to allow installs from unknown sources if you sideload via file transfer.

## Notes

- For completely offline bundles you would need to `next export` to a static site and set `webDir` accordingly, but as-is the app relies on a running Next.js server (default `CAP_SERVER_URL` in `capacitor.config.ts`).
- If you change Capacitor plugins or native code, re-run `npm run android:sync` before rebuilding.

With these steps you can go from the current web codebase to a native-installable APK entirely via Capacitor without touching Flutter.
