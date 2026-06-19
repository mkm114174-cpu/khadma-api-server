const fs = require("fs");
const path = require("path");

const androidDir = process.argv[2];
if (!androidDir) {
  console.error("Usage: node patch-android-signing.cjs <androidDir>");
  process.exit(1);
}

const appGradle = path.join(androidDir, "app", "build.gradle");
let text = fs.readFileSync(appGradle, "utf8");

if (text.includes("KHADMA_UPLOAD_STORE_FILE")) {
  process.exit(0);
}

const signingBlock = `
    signingConfigs {
        release {
            if (project.hasProperty('KHADMA_UPLOAD_STORE_FILE')) {
                storeFile file(KHADMA_UPLOAD_STORE_FILE)
                storePassword KHADMA_UPLOAD_STORE_PASSWORD
                keyAlias KHADMA_UPLOAD_KEY_ALIAS
                keyPassword KHADMA_UPLOAD_KEY_PASSWORD
            }
        }
    }
`;

text = text.replace(/android\s*\{/, (match) => match + signingBlock);
text = text.replace(
  /signingConfig signingConfigs\.debug/g,
  "signingConfig signingConfigs.release",
);

fs.writeFileSync(appGradle, text);
