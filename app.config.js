require('dotenv').config();

module.exports = {
  expo: {
    name: "XR Archaeology",
    slug: "xrarchaeology",
    scheme: "xrarchaeology",
    extra: {
      eas: {
        projectId: "8363bd2f-804d-4936-a6e3-eeac53ce3e6b"
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
    }
  }
};
