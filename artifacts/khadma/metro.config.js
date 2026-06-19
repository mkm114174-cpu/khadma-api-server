const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Workaround for @clerk/expo 3.4.2 on web:
// Its internal requires use an explicit `.js` extension
// (e.g. require('../specs/NativeClerkModule.js')), which defeats Metro's
// platform-extension resolution. On web this loads the NATIVE TurboModule spec,
// which calls `TurboModuleRegistry.get(...)` at module-eval time and crashes
// because `TurboModuleRegistry` is undefined under react-native-web. The package
// ships a web stub (`NativeClerkModule.web.js`, exports null) for exactly this
// case — redirect to it when bundling for web.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && /[\\/]specs[\\/]NativeClerkModule\.js$/.test(moduleName)) {
    return context.resolveRequest(
      context,
      moduleName.replace(/NativeClerkModule\.js$/, "NativeClerkModule.web.js"),
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
