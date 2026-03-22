const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Watch the parent's src directory for live source changes
config.watchFolders = [path.resolve(monorepoRoot, "src")];

// Map the package name to the parent's source
config.resolver.extraNodeModules = {
  "react-native-emoji-burst": path.resolve(monorepoRoot, "src"),
};

// Ensure shared dependencies resolve from example's node_modules ONLY
// This prevents duplicate React/Reanimated/Skia instances
const sharedDeps = [
  "react",
  "react-native",
  "react-native-reanimated",
  "react-native-worklets",
  "@shopify/react-native-skia",
];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const dep of sharedDeps) {
    if (moduleName === dep || moduleName.startsWith(dep + "/")) {
      return context.resolveRequest(
        { ...context, originModulePath: path.resolve(projectRoot, "index.js") },
        moduleName,
        platform
      );
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
