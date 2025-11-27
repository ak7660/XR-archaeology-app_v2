// Load environment variables
require('dotenv').config();

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "@babel/plugin-proposal-export-namespace-from",
      "react-native-reanimated/plugin",
      "expo-router/babel",
      ["@babel/plugin-transform-flow-strip-types"],
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      ["@babel/plugin-proposal-class-properties", { loose: true }],
      [
        "module-resolver",
        {
          alias: {
            "@": ".",
            "@assets": "./assets",
            "@components": "./components",
            "@app": "./app",
            "@styles": "./styles",
            "@providers": "./providers",
            "@models": "./models",
          },
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      ],
      // Inline environment variables at build time
      [
        "transform-inline-environment-variables",
        {
          include: [
            "EXPO_PUBLIC_API_URL",
            "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY",
            "EXPO_PUBLIC_TRIP_PLAN_API_URL",
            "EXPO_PUBLIC_TRIP_PLAN_API_KEY",
            "EXPO_PUBLIC_PREFIX"
          ]
        }
      ],
    ],
  };
};
