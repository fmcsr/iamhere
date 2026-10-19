<p align="center">
  <img src="apps/mobile/assets/images/icon.png" width="112" alt="HERE app icon" />
</p>

<h1 align="center">HERE</h1>

<p align="center">
  <b>I am Here · #iamhere</b><br />
  A venue-first social app for nights out: check in where you are, chat with who’s there.
</p>

<p align="center">
  <a href="https://github.com/fmcsr/iamhere/actions/workflows/ci.yml"><img src="https://github.com/fmcsr/iamhere/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/iOS-27-000000?logo=apple&logoColor=white" alt="iOS 27" />
  <img src="https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo&logoColor=white" alt="Expo SDK 58" />
  <img src="https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react&logoColor=black" alt="React Native 0.88" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-18%20%2B%20PostGIS-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL 18 + PostGIS" />
  <img src="https://img.shields.io/badge/status-prototype-E11D49" alt="Status: prototype" />
</p>

<p align="center">
  <a href="README.tr.md">Türkçe</a> ·
  <a href="docs/media-kit/README.md">Media kit</a> ·
  <a href="docs/ROTA.md">Roadmap</a> ·
  <a href="docs/TASARIM.md">Design system</a> ·
  <a href="docs/ARCHITECTURE.md">Architecture</a>
</p>

![HERE: screens from the iOS 27 prototype, light mode, dark mode and iPhone Duo](docs/media-kit/here-media-kit.jpg)

## The idea

Most social apps are built around people. HERE is built around **places, tonight**. Open the app and you see which venues are live around you: how many people are there, which of your friends are there, what’s on. When you arrive, you **check in** (only possible within 300 m of the venue) and you’re in the venue’s **group chat** with everyone else who’s actually there: plan the after-party, find a table, share the moment.

Chats are ephemeral by design: **every chat resets at 04:00**. What stays is yours: the photos you posted and a calendar of the nights you went out.

## Highlights

- **Check in by sliding a pin.** A bottom sheet with a vertical slider: drag the pin down and it “pins” you to the venue, then drops you straight into the venue chat. Photos are camera-only, taken in the moment.
- **Venue chats that reset every night.** Messages, plans (“I’m in”) and message requests are all gone at 04:00. The countdown lives in the chat, not in your face.
- **Liquid Glass on iOS 27.** Native tab bar with a prominent “Here” tab and a live accessory while you’re checked in, glass sheets and cards, SwiftUI controls via `@expo/ui`, an Instagram-style red dot drawn into the tab icon by iOS itself.
- **A profile built around nights.** Memories calendar, tagged posts, a To-HERE list of places you want to go (with friends who saved them too) and a classic edit screen.
- **Bilingual.** English and Turkish, switchable live in Settings, including dates, distances, plurals and the seed content.
- **Brand made in code.** The balloon wordmark is rendered procedurally (Poisson inflation, latex shading, ray-marched spin frames for pull-to-refresh) by [`generate-brand.py`](apps/mobile/scripts/generate-brand.py).
- **A database designed to forget.** Chat data is partitioned per night, hidden at 04:00 by row-level security and dropped from disk within a minute by `pg_cron`. Locations are masked to a grid and never stored raw. Time-travel SQL tests prove it.

## Tech stack

| Layer | Prototype in this repo | Planned |
|---|---|---|
| **Mobile** | Expo SDK 58, React Native 0.88 (New Architecture, React Compiler), Expo Router native tabs, Reanimated 4, Gesture Handler, `expo-glass-effect`, `@expo/ui` (SwiftUI), `react-native-maps` | Android polish |
| **App data** | In-app store on mock data, persisted settings (AsyncStorage) | TanStack Query, Socket.IO |
| **API** | — | NestJS (Fastify), Kysely, Zod contracts, BullMQ |
| **Database** | PostgreSQL 18, PostGIS 3.6, `pg_cron`, dbmate migrations, SQL tests | — |
| **Infra** | Docker Compose (PostgreSQL + Valkey) | S3-compatible storage, Expo Push |

## Repository

```
apps/mobile/        Expo app, the iOS-first prototype (runs fully on mock data)
db/                 SQL migrations (dbmate) and time-travel tests
infra/docker/       PostgreSQL + PostGIS + pg_cron image
docs/               roadmap, design system and architecture (Turkish) · media kit (English)
```

## Getting started

### Mobile prototype

Needs Node 22, Xcode 27 with the iOS 27 simulator, and CocoaPods. The app uses native modules, so it runs as a development build (not in Expo Go). No backend is needed.

```bash
cd apps/mobile
npm install
npx expo run:ios --device "iPhone 18 Pro"
```

Switch the language in **Settings › Language**. More in [apps/mobile/README.md](apps/mobile/README.md).

### Database

```bash
cp .env.example .env
docker compose up -d --wait
npx dbmate up
PSQL="docker compose exec -T postgres psql -U anlik_owner" ./db/tests/run.sh
```

How the nightly purge works: [db/README.md](db/README.md).

## Status

| Part | State |
|---|---|
| iOS app | Core loop works end to end on mock data: discover, check in, chat, plan, profile, settings, two languages |
| Database | Nightly purge engine, geo privacy, moderation and scheduler implemented and tested; schema update for persistent posts pending |
| API and realtime | Designed ([architecture](docs/ARCHITECTURE.md)), not built yet |
| Open product questions | Tracked in the [roadmap](docs/ROTA.md#14-sıradaki-adım) |

Product, design and architecture decisions are logged as they’re made (K-xx in the roadmap, T-xx in the design system). Those documents are in Turkish.

## License

Copyright © 2026 HERE. All rights reserved. This repository is shared as a portfolio piece; the code, designs and brand may not be reused without permission.
