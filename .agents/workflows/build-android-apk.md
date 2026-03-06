---
description: How to build and sign the Android APK
---

# Building and Signing the Android APK

When asked to build the Android APK, you must follow these specific steps because the default Tauri environment is missing the NDK and Android 11+ phones reject unsigned APKs.

## 1. Set the correct Android Environment Variables

The system has a manually installed Android SDK and NDK that Tauri will not find by default. Before running the build command, you MUST export these variables:

```bash
export ANDROID_HOME=/home/shin/.android-sdk-tauri
export NDK_HOME=/home/shin/.android-sdk-tauri/ndk/25.1.8937393
export ANDROID_NDK_HOME=/home/shin/.android-sdk-tauri/ndk/25.1.8937393
```

## 2. Build the APK

Run the Tauri build command with the variables exported (either in the same line or in a persistent shell):

```bash
export ANDROID_HOME=/home/shin/.android-sdk-tauri && \
export NDK_HOME=/home/shin/.android-sdk-tauri/ndk/25.1.8937393 && \
export ANDROID_NDK_HOME=/home/shin/.android-sdk-tauri/ndk/25.1.8937393 && \
npm run tauri android build -- --apk
```

The unsigned APK will be generated at:
`src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`

## 3. Cryptographically Sign the APK

Modern Android phones WILL reject this APK ("invalid package") unless it is zipped and cryptographically signed.

You must run this exact command to generate a keystore, align the zip, sign it, and place it in the project root as `lumina-release.apk`:

```bash
keytool -genkey -v -keystore release.keystore -alias lumina -keyalg RSA -keysize 2048 -validity 10000 -storepass lumina123 -keypass lumina123 -dname "CN=Lumina, OU=Lumina, O=Lumina, L=Lumina, ST=Lumina, C=US" && \
/home/shin/.android-sdk-tauri/build-tools/35.0.0/zipalign -v -f 4 src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk aligned.apk && \
/home/shin/.android-sdk-tauri/build-tools/35.0.0/apksigner sign --ks release.keystore --ks-pass pass:lumina123 --out lumina-release.apk aligned.apk && \
rm aligned.apk release.keystore
```

## 4. Final Output

Notify the user that the fully signed, ready-to-install APK is available at the root of the project:
`lumina-release.apk`
