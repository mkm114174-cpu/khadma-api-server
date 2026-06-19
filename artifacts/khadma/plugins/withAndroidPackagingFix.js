const { withGradleProperties } = require("expo/config-plugins");

/** Duplicate META-INF from okhttp3 + jspecify breaks mergeReleaseJavaResource. */
const PICK_FIRST_PATHS = [
  "META-INF/versions/9/OSGI-INF/MANIFEST.MF",
  "META-INF/DEPENDENCIES",
  "META-INF/LICENSE",
  "META-INF/LICENSE.txt",
  "META-INF/NOTICE",
  "META-INF/NOTICE.txt",
].join(",");

function withAndroidPackagingFix(config) {
  return withGradleProperties(config, (modConfig) => {
    const key = "android.packagingOptions.pickFirsts";
    const props = modConfig.modResults;
    const idx = props.findIndex(
      (p) => p.type === "property" && p.key === key,
    );
    if (idx >= 0) {
      const cur = String(props[idx].value ?? "");
      const missing = PICK_FIRST_PATHS.split(",").filter(
        (path) => !cur.includes(path),
      );
      if (missing.length > 0) {
        props[idx].value = cur ? `${cur},${missing.join(",")}` : missing.join(",");
      }
    } else {
      props.push({ type: "property", key, value: PICK_FIRST_PATHS });
    }
    return modConfig;
  });
}

module.exports = withAndroidPackagingFix;
