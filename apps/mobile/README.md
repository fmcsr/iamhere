# HERE · iOS app

The HERE prototype: an iOS-first [Expo](https://expo.dev) app built for iOS 27 and Liquid Glass with Expo SDK 58 and React Native 0.88 (New Architecture, React Compiler). It runs entirely on mock data, so no backend is needed.

## Run

You need:

- Node 22
- Xcode 27 with the iOS 27 simulator
- CocoaPods

The app uses native modules, so it runs as a development build, not in Expo Go.

```bash
npm install
npx expo run:ios --device "iPhone 18 Pro"
```

Once the build is installed, `npx expo start` is enough for JavaScript changes.

Rebuild after any change to `app.json`, the config plugins or native packages:

```bash
npx expo prebuild -p ios --clean && npx expo run:ios
```

Checks (CI runs both):

```bash
npx tsc --noEmit
npx expo lint
```

## Structure

```
src/app/          screens (Expo Router)
                  (tabs): home · explore · here · messages · profile
                  venue/[id] · chat/[id] · check-in sheet · settings · edit-profile · …
src/components/   shared UI: glass surfaces, cards and rows, pin slider, profile parts,
                  native controls (SwiftUI on iOS through @expo/ui)
src/data/         mock data (mock.ts), its English version (mock.en.ts), app state (store.tsx)
src/i18n/         strings per area (common, home, messages, profile, settings), Turkish and English
src/lib/          the 04:00 night cycle, Turkish name grammar, profile rules
plugins/          config plugin that copies the tab icons into the iOS asset catalog
scripts/          generate-brand.py · generate-tab-icons.swift · build-media-kit.py
```

## Notes

- **Mock world.**
  - The seed data covers venues around Kadıköy, people, posts, chats and plans.
  - Your location is simulated.
  - Check-in only works within 300 m of a venue.
  - Settings, language and profile edits are saved on the device.
- **Languages.** Pick one in Settings › Language: System, Türkçe or English.
  - To add a string, put it in the matching module under `src/i18n/strings/` in both `tr` and `en`; TypeScript enforces the same shape.
  - Read strings with `useT()`.
  - Helpers like `formatDistance(m, t)` and `minutesAgo(ts, t)` take the dictionary so they update the moment the language changes.
- **Brand.**
  - `python3 scripts/generate-brand.py` (Pillow, numpy) regenerates:
    - the app icon (Icon Composer)
    - the splash and Android icons
    - the favicon
    - the pull-to-refresh spin sprite
  - The balloon letters come from a Poisson-inflated glyph mask, shaded like latex.
- **Messages tab dot.** iOS draws this tab icon itself: a Swift script runs in the simulator and writes it to `assets/xcassets/`, and `plugins/with-xcassets.js` copies it into the asset catalog at prebuild. That keeps the dot red while the icon follows light and dark mode.
- **Media kit.** `scripts/build-media-kit.py` builds [`docs/media-kit/here-media-kit.jpg`](../../docs/media-kit/README.md) from English screenshots.
- **Design rules.** Liquid Glass usage, colors, type and every design decision (T-xx) are in [docs/TASARIM.md](../../docs/TASARIM.md) (Turkish).
