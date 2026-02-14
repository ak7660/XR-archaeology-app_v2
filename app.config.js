require('dotenv').config();

module.exports = {
  expo: {
    name: "XR Archaeology",
    slug: "xrarchaeology",
    scheme: "xrarchaeology",
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
    }
  }
};
