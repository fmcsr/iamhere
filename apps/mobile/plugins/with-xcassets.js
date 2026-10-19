// assets/xcassets/ altındaki imageset'leri (Mesajlar sekmesinin kırmızı noktalı simgesi, T-27) iOS asset
// kataloğuna kopyalar. ios/ elle düzenlenmez (CNG): `expo prebuild` her seferinde yeniden kurar.
// Kataloğa koymanın nedeni açık/koyu çeşitleri: iOS hangisini göstereceğini kendisi seçer.
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

module.exports = function withXcassets(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const source = path.join(cfg.modRequest.projectRoot, 'assets', 'xcassets');
      const catalog = path.join(cfg.modRequest.platformProjectRoot, cfg.modRequest.projectName, 'Images.xcassets');
      for (const name of fs.readdirSync(source)) {
        fs.cpSync(path.join(source, name), path.join(catalog, name), { recursive: true });
      }
      return cfg;
    },
  ]);
};
