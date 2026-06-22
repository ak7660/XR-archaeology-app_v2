require('dotenv').config();

module.exports = {
  expo: {
    name: "Veditourism",
    slug: "xrarchaeology",
    scheme: "xrarchaeology",
    icon: "./assets/appicon.png",
    extra: {
      eas: {
        projectId: "75d7197d-e827-450a-ae61-5198a779132d"
      },
      // Explicitly pass environment variables to the app
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      EXPO_PUBLIC_TRIP_PLAN_API_URL: process.env.EXPO_PUBLIC_TRIP_PLAN_API_URL,
      EXPO_PUBLIC_TRIP_PLAN_API_KEY: process.env.EXPO_PUBLIC_TRIP_PLAN_API_KEY,
      EXPO_PUBLIC_PREFIX: process.env.EXPO_PUBLIC_PREFIX || "",
    },
    android: {
      package: "com.ahmadhassan44.xrarchaeology"
    },
    ios: {
      bundleIdentifier: "com.ahmadhassan44.xrarchaeology"
    },
    // IMPORTANT: these plugins re-apply the Viro/AR native setup on every
    // `expo prebuild`. Without them, prebuild wipes the manual native edits
    // and all AR screens crash (see plugins/withViroAr.js for the full story).
    plugins: [
      // Viro needs minSdk >= 24 and a compatible NDK. expo-build-properties is
      // the official way to set these so a regenerated build.gradle keeps them.
      ["expo-build-properties", { android: { minSdkVersion: 24, ndkVersion: "23.1.7779620" } }],
      // All Viro-specific native wiring (package registration, gradle deps,
      // camera permission, AR manifest entries, iOS camera usage string).
      ["./plugins/withViroAr", { googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY }]
    ]
  }
};
