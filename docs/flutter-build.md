# Flutter APK Build Cheatsheet

Follow these steps from your Flutter project directory to produce installable APKs for each Android ABI.

1. **Open a terminal in VS Code (or anywhere)**  
   Use ``Ctrl+` `` to pop open the integrated terminal and confirm you're at the Flutter app root (the one with `pubspec.yaml`).
2. **Build split-per-ABI APKs**  
   ```bash
   flutter build apk --split-per-abi
   ```  
   Flutter will emit three APKs under `build/app/outputs/flutter-apk/`:
   - `app-armeabi-v7a-release.apk`
   - `app-arm64-v8a-release.apk`
   - `app-x86_64-release.apk`
3. **Pick the right artifact**  
   - Most modern phones are arm64, so `app-arm64-v8a-release.apk` is usually the winner.  
   - Older/cheaper Android devices may still require `armeabi-v7a`.  
   - `x86_64` is mainly for emulators or niche hardware.
4. **Install on device**  
   - Copy or drag the chosen APK onto the phone (USB, AirDrop, Drive, etc.).  
   - Enable "Install unknown apps" (aka sideloading) for the file manager you're using if Android complains.  
   - Tap the APK to install; if asked about debug builds, acknowledge and continue.

That's it—no Play Store upload needed for local testing. Repeat the command whenever you need a fresh build.
