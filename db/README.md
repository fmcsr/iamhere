# Database

PostgreSQL 18 with PostGIS 3.6 and `pg_cron`, written as plain SQL migrations (dbmate) with SQL tests. This is the data layer the HERE API will sit on; the iOS prototype runs on mock data and doesn’t use it yet.

## Two kinds of data

| Schema | Lifetime | What’s in it |
|---|---|---|
| `core` | Permanent | Accounts, identities, devices, profiles, blocks, reports |
| `ephemeral` | One night | Chats, memberships, messages, location pins, nightly anonymous personas |

A *night* (cycle) runs from 04:00 to 04:00 local time: `Europe/Istanbul` by default, configurable in `ephemeral.config`. The boundary follows the local wall clock, so it stays at 04:00 across daylight-saving changes (tested with Berlin).

## How a night is forgotten

1. **Partitions.** Every ephemeral table is partitioned by `cycle_date`, one partition per night.
2. **Instant invisibility.** Row-level security limits every ephemeral table to `cycle_date = (SELECT current_cycle())`. At 04:00:00 the old night disappears for the app role, for reads and writes, before anything is deleted.
3. **Physical deletion within a minute.** `pg_cron` calls `ephemeral.run_maintenance()` every minute. It opens partitions for the next three nights, then detaches and drops expired ones, children before parents. It also deletes stale location pins and expired report evidence. Each step runs in its own transaction with a 2-second lock timeout, and missed runs are caught up on the next tick.
4. **Proof.** `ephemeral.purge_log` records which night, table, rows and bytes were dropped, with no content.

Dropping a partition takes milliseconds and removes the file from disk. Deleting millions of rows at 04:00 would take minutes, flood the WAL and bloat the tables.

## Location privacy

- **Grid snapping.** Coordinates are snapped to the centre of a ~250 m (`near`) or ~1 km (`area`) grid cell. Raw GPS is never stored, and there is no jitter that could be averaged away.
- **Single write path.** Locations are written only through `upsert_presence()` and `create_room()`. The app role has no direct `INSERT`/`UPDATE` on those tables.
- **Distance buckets.** Distances come back only as buckets (< 500 m, < 1 km, < 2 km, < 5 km). Within a bucket the order is pseudo-random but stable for the night, so the ranking can’t be used for trilateration.
- **See to be seen.** Without a location pin, you can’t discover anyone.

## Moderation

A report copies the reported message and the 20 messages before it into `core.report_evidence`. The copy is kept for 90 days, so evidence survives 04:00.

## Migrations

| Migration | Contents |
|---|---|
| `0001_foundation` | PostGIS, `core` and `ephemeral` schemas, roles |
| `0002_core_schema` | Permanent data: users, identities, devices, profiles, blocks, reports |
| `0003_ephemeral_cycle_engine` | Night maths, partition management, `run_maintenance()` |
| `0004_ephemeral_schema` | Nightly tables (persona, location pin, chat, membership, message) with RLS |
| `0005_geo_privacy_discovery` | Grid masking, distance buckets, nearby people and rooms |
| `0006_moderation` | Report evidence copy (90 days) |
| `0007_scheduler` | `pg_cron`: maintenance every minute |

## Tests

Each `*.test.sql` file runs in its own database, cloned from a migrated template. The tests travel in time with `SET ephemeral.now = '…'` and also check that every migration rolls back cleanly (up → down → up).

```bash
docker compose up -d --wait
PSQL="docker compose exec -T postgres psql -U anlik_owner" ./db/tests/run.sh
```

Without Docker, any PostgreSQL 18 with PostGIS 3.6 works; `pg_cron` is optional. The tests need a superuser and connect through the standard `PGHOST` / `PGPORT` / `PGUSER` variables.

## Rules

- **New ephemeral tables.** Partition by `cycle_date`, register the table in `ephemeral.cycle_tables` and add its RLS policy. The `30_privileges` test fails otherwise.
- **Function grants.** Every migration that creates functions runs `REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA core, ephemeral FROM PUBLIC;` before its grants.
- **No raw coordinates.** Locations are written only through `upsert_presence()` / `create_room()`. Raw coordinates never reach logs, error messages or tables.

## Status

Identifiers still use the working name (`anlik_*`). The product has since decided that posts and check-ins are permanent and only chats reset ([K-16](../docs/ROTA.md)). The schema update for that is planned for phase 2 ([architecture §14](../docs/ARCHITECTURE.md)).
