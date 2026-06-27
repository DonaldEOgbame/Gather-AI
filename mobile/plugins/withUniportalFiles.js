/**
 * Expo config plugin — UniportalFiles native scanner + UniportalShare intake.
 *
 * Makes the enterprise MANAGE_EXTERNAL_STORAGE scanner and the share-sheet
 * receiver survive `expo prebuild` (including `--clean`), which regenerates the
 * android/ tree and would otherwise wipe hand-placed native sources and the
 * MainApplication / MainActivity edits.
 *
 * On prebuild it:
 *   1. Copies the canonical Kotlin from plugins/native/ into the app's package
 *      dir, rewriting the `package` line to match android.package.
 *   2. Registers UniportalFilesPackage() in MainApplication's getPackages().
 *   3. Adds onNewIntent() to MainActivity so warm-start shares reach JS.
 *
 * Canonical source of truth: plugins/native/*.kt. The copies under android/ are
 * regenerated from there on every prebuild, so they can't drift.
 */
const fs = require("fs");
const path = require("path");
const {
  withDangerousMod,
  withMainApplication,
  withMainActivity,
} = require("expo/config-plugins");

const KOTLIN_FILES = [
  "UniportalFilesModule.kt",
  "UniportalShareModule.kt",
  "UniportalFilesPackage.kt",
];
const PACKAGE_ADD = "add(UniportalFilesPackage())";

const ON_NEW_INTENT = `
  override fun onNewIntent(intent: android.content.Intent?) {
    super.onNewIntent(intent)
    if (intent == null) return
    setIntent(intent)
    (reactInstanceManager.currentReactContext as? com.facebook.react.bridge.ReactApplicationContext)?.let {
      UniportalShareModule.emit(it, intent)
    }
  }
`;

function withSourceFiles(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const pkg = config.android && config.android.package;
      if (!pkg) {
        throw new Error("withUniportalFiles: expo.android.package is not set");
      }
      const srcDir = path.join(config.modRequest.projectRoot, "plugins", "native");
      const destDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/java",
        pkg.replace(/\./g, "/"),
      );
      fs.mkdirSync(destDir, { recursive: true });

      for (const file of KOTLIN_FILES) {
        const contents = fs
          .readFileSync(path.join(srcDir, file), "utf8")
          .replace(/^package .*$/m, `package ${pkg}`);
        fs.writeFileSync(path.join(destDir, file), contents);
      }
      return config;
    },
  ]);
}

function withPackageRegistration(config) {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    if (contents.includes(PACKAGE_ADD)) {
      return config; // idempotent — already registered
    }
    const marker = "// add(MyReactNativePackage())";
    if (contents.includes(marker)) {
      contents = contents.replace(marker, `${marker}\n              ${PACKAGE_ADD}`);
    } else {
      // Fallback for templates without the example comment.
      contents = contents.replace(
        /(PackageList\(this\)\.packages\.apply\s*\{)/,
        `$1\n              ${PACKAGE_ADD}`,
      );
    }
    config.modResults.contents = contents;
    return config;
  });
}

function withShareIntent(config) {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;
    if (contents.includes("override fun onNewIntent")) {
      return config; // idempotent
    }
    // Inject right after the class opening brace. Fully-qualified types in the
    // method body avoid needing extra import lines.
    contents = contents.replace(
      /(class MainActivity : ReactActivity\(\) \{)/,
      `$1\n${ON_NEW_INTENT}`,
    );
    config.modResults.contents = contents;
    return config;
  });
}

module.exports = function withUniportalFiles(config) {
  config = withSourceFiles(config);
  config = withPackageRegistration(config);
  config = withShareIntent(config);
  return config;
};
