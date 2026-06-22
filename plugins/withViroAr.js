// @ts-check
/**
 * Expo config plugin: re-applies every manual native change that
 * @viro-community/react-viro requires, so they survive `expo prebuild`.
 *
 * WHY THIS EXISTS
 * ---------------
 * Viro does NOT support React Native autolinking (it has no
 * react-native.config.js). Its integration lives entirely in hand-edited
 * native files. Running `expo prebuild` regenerates android/ and ios/ from
 * the bare Expo template and silently wipes ALL of it — which is exactly
 * what happened in commit 81bda87e and caused every AR screen to crash.
 *
 * This plugin reproduces those edits programmatically. As long as it stays
 * in the `plugins` array of app.config.js, a future prebuild restores:
 *
 *   1. MainApplication.java  — registers ReactViroPackage (the crash fix)
 *   2. settings.gradle       — includes the 4 Viro Gradle subprojects
 *   3. app/build.gradle      — adds the Viro implementation dependencies
 *   4. AndroidManifest.xml   — CAMERA permission, AR features, largeHeap,
 *                              cleartext traffic, Maps key, ARCore meta-data
 *   5. ios/Info.plist        — NSCameraUsageDescription (iOS hard-crash fix)
 *   6. gradle.properties     — android.minSdkVersion (Viro requires >= 24)
 *
 * NOTE: NDK version and (optionally) minSdk are best handled by the official
 * `expo-build-properties` plugin — see the snippet in app.config.js. This
 * plugin also sets minSdk in gradle.properties as a belt-and-suspenders so
 * it works even if expo-build-properties is removed.
 *
 * @typedef {object} ViroArProps
 * @property {string} [googleMapsApiKey] Value for the
 *   com.google.android.geo.API_KEY manifest meta-data (Android Maps).
 * @property {string} [iosCameraUsageDescription] NSCameraUsageDescription text.
 * @property {number} [minSdkVersion] Minimum Android SDK (Viro needs >= 24).
 */

const {
  withMainApplication,
  withSettingsGradle,
  withAppBuildGradle,
  withGradleProperties,
  withAndroidManifest,
  withInfoPlist,
  createRunOncePlugin,
} = require("@expo/config-plugins");

const VIRO_ANDROID_BASE = "../node_modules/@viro-community/react-viro/android";

// ---------------------------------------------------------------------------
// 1. MainApplication — register the Viro native package
// ---------------------------------------------------------------------------
const withViroMainApplication = (config) =>
  withMainApplication(config, (cfg) => {
    let contents = cfg.modResults.contents;
    const isJava = cfg.modResults.language === "java";

    if (!contents.includes("com.viromedia.bridge.ReactViroPackage")) {
      // Add the import.
      const importLine = isJava
        ? "import com.viromedia.bridge.ReactViroPackage;"
        : "import com.viromedia.bridge.ReactViroPackage";
      // Anchor on the SoLoader import, which is always present in both templates.
      contents = contents.replace(
        /(import com\.facebook\.soloader\.SoLoader;?)/,
        `$1\n${importLine}`
      );
    }

    if (!contents.includes("new ReactViroPackage(") && !contents.includes("ReactViroPackage(ReactViroPackage.ViroPlatform")) {
      if (isJava) {
        const addLine =
          '          packages.add(new ReactViroPackage(ReactViroPackage.ViroPlatform.valueOf("AR")));';
        contents = contents.replace(
          /(List<ReactPackage>\s+packages\s*=\s*new PackageList\(this\)\.getPackages\(\);)/,
          `$1\n${addLine}`
        );
      } else {
        // Kotlin (future Expo templates use MainApplication.kt)
        const addLine =
          '            add(ReactViroPackage(ReactViroPackage.ViroPlatform.valueOf("AR")))';
        // Kotlin template uses: val packages = PackageList(this).packages  ... .apply { } OR returns the list.
        contents = contents.replace(
          /(val packages(?::\s*[^=\n]+)?\s*=\s*PackageList\(this\)\.packages)/,
          `$1.apply {\n${addLine}\n          }`
        );
      }
    }

    cfg.modResults.contents = contents;
    return cfg;
  });

// ---------------------------------------------------------------------------
// 2. settings.gradle — include the Viro Gradle subprojects
// ---------------------------------------------------------------------------
const withViroSettingsGradle = (config) =>
  withSettingsGradle(config, (cfg) => {
    if (!cfg.modResults.contents.includes(":viro_renderer")) {
      cfg.modResults.contents +=
        "\n\n// --- Viro AR native modules (added by withViroAr plugin) ---\n" +
        "include ':react_viro', ':arcore_client', ':gvr_common', ':viro_renderer'\n" +
        `project(':arcore_client').projectDir = new File('${VIRO_ANDROID_BASE}/arcore_client')\n` +
        `project(':gvr_common').projectDir = new File('${VIRO_ANDROID_BASE}/gvr_common')\n` +
        `project(':viro_renderer').projectDir = new File('${VIRO_ANDROID_BASE}/viro_renderer')\n` +
        `project(':react_viro').projectDir = new File('${VIRO_ANDROID_BASE}/react_viro')\n`;
    }
    return cfg;
  });

// ---------------------------------------------------------------------------
// 3. app/build.gradle — add the Viro implementation dependencies
// ---------------------------------------------------------------------------
const VIRO_DEPS = [
  "    // Viro AR native modules (added by withViroAr plugin)",
  "    implementation project(':gvr_common')",
  "    implementation project(':arcore_client')",
  "    implementation project(path: ':react_viro')",
  "    implementation project(path: ':viro_renderer')",
  "    implementation 'com.google.android.exoplayer:exoplayer:2.7.1'",
  "    implementation 'com.google.protobuf.nano:protobuf-javanano:3.0.0-alpha-7'",
].join("\n");

const withViroAppBuildGradle = (config) =>
  withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes(":react_viro")) {
      if (contents.includes('implementation("com.facebook.react:react-android")')) {
        // Insert right after the core react-android dependency.
        contents = contents.replace(
          /(implementation\("com\.facebook\.react:react-android"\))/,
          `$1\n\n${VIRO_DEPS}`
        );
      } else {
        // Fallback: insert at the start of the dependencies { } block.
        contents = contents.replace(/(\ndependencies\s*\{)/, `$1\n${VIRO_DEPS}\n`);
      }
      cfg.modResults.contents = contents;
    }
    return cfg;
  });

// ---------------------------------------------------------------------------
// 4. AndroidManifest.xml — permissions, AR features, app flags, meta-data
// ---------------------------------------------------------------------------
const withViroManifest = (config, props) =>
  withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // Ensure the tools namespace (needed for tools:replace / tools:node below).
    manifest.$ = manifest.$ || {};
    manifest.$["xmlns:tools"] =
      manifest.$["xmlns:tools"] || "http://schemas.android.com/tools";

    // --- permissions ---
    manifest["uses-permission"] = manifest["uses-permission"] || [];
    const ensurePermission = (name) => {
      const has = manifest["uses-permission"].some(
        (p) => p.$ && p.$["android:name"] === name
      );
      if (!has) manifest["uses-permission"].push({ $: { "android:name": name } });
    };
    ensurePermission("android.permission.CAMERA");
    ensurePermission("android.permission.ACCESS_MEDIA_LOCATION");
    ensurePermission("android.permission.FOREGROUND_SERVICE_LOCATION");

    // --- uses-feature (AR / OpenGL / sensors) ---
    manifest["uses-feature"] = manifest["uses-feature"] || [];
    const ensureFeature = (attrs, matchKey) => {
      const has = manifest["uses-feature"].some(
        (f) => f.$ && f.$[matchKey] === attrs[matchKey]
      );
      if (!has) manifest["uses-feature"].push({ $: attrs });
    };
    ensureFeature({ "android:name": "android.hardware.camera" }, "android:name");
    ensureFeature(
      { "android:name": "android.hardware.camera.autofocus", "android:required": "false", "tools:replace": "required" },
      "android:name"
    );
    ensureFeature(
      { "android:glEsVersion": "0x00030000", "android:required": "false", "tools:node": "remove", "tools:replace": "required" },
      "android:glEsVersion"
    );
    ensureFeature(
      { "android:name": "android.hardware.sensor.accelerometer", "android:required": "false", "tools:replace": "required" },
      "android:name"
    );
    ensureFeature(
      { "android:name": "android.hardware.sensor.gyroscope", "android:required": "false", "tools:replace": "required" },
      "android:name"
    );

    // --- queries: ARCore package visibility (Android 11+) ---
    manifest.queries = manifest.queries || [{}];
    const q = manifest.queries[0];
    q.package = q.package || [];
    if (!q.package.some((p) => p.$ && p.$["android:name"] === "com.google.ar.core")) {
      q.package.push({ $: { "android:name": "com.google.ar.core" } });
    }

    // --- application flags + meta-data ---
    const app = manifest.application && manifest.application[0];
    if (app) {
      app.$ = app.$ || {};
      app.$["android:largeHeap"] = "true"; // big 3D models / textures
      app.$["android:usesCleartextTraffic"] = "true"; // allow http API on Android 9+

      app["meta-data"] = app["meta-data"] || [];
      const ensureMeta = (name, value) => {
        const existing = app["meta-data"].find(
          (m) => m.$ && m.$["android:name"] === name
        );
        if (existing) existing.$["android:value"] = value;
        else app["meta-data"].push({ $: { "android:name": name, "android:value": value } });
      };
      ensureMeta("com.google.ar.core", "optional");
      if (props && props.googleMapsApiKey) {
        ensureMeta("com.google.android.geo.API_KEY", props.googleMapsApiKey);
      }
    }

    return cfg;
  });

// ---------------------------------------------------------------------------
// 5. iOS Info.plist — camera usage description (without it, iOS hard-crashes)
// ---------------------------------------------------------------------------
const withViroInfoPlist = (config, props) =>
  withInfoPlist(config, (cfg) => {
    if (!cfg.modResults.NSCameraUsageDescription) {
      cfg.modResults.NSCameraUsageDescription =
        (props && props.iosCameraUsageDescription) ||
        "Allow $(PRODUCT_NAME) to access your camera for the AR experience";
    }
    return cfg;
  });

// ---------------------------------------------------------------------------
// 6. gradle.properties — minSdk (Viro requires >= 24)
// ---------------------------------------------------------------------------
const withViroMinSdk = (config, props) =>
  withGradleProperties(config, (cfg) => {
    const key = "android.minSdkVersion";
    const value = String((props && props.minSdkVersion) || 24);
    const existing = cfg.modResults.find(
      (item) => item.type === "property" && item.key === key
    );
    if (existing) existing.value = value;
    else cfg.modResults.push({ type: "property", key, value });
    return cfg;
  });

// ---------------------------------------------------------------------------
// Compose all mods
// ---------------------------------------------------------------------------
/** @type {(config: import('@expo/config-plugins').ExpoConfig, props?: ViroArProps) => any} */
const withViroAr = (config, props = {}) => {
  config = withViroMainApplication(config);
  config = withViroSettingsGradle(config);
  config = withViroAppBuildGradle(config);
  config = withViroManifest(config, props);
  config = withViroInfoPlist(config, props);
  config = withViroMinSdk(config, props);
  return config;
};

module.exports = createRunOncePlugin(withViroAr, "withViroAr", "1.0.0");
