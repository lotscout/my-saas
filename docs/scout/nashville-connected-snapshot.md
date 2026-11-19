# Nashville collected-record connection

The server-side advisor route exposes two bounded calculation tools to the existing model. These are actual collected public records, not LotScout marketplace inventory. No public bulk-download endpoint, billing, waitlist or DNS changes.

## Snapshot and provenance

November 19, 2026 Dot compact package, already reconciled in the workspace. Server-only JSON modules under `lib/scout/data` retain selected source fields, never owner/contact columns. The candidate dataset stores the SHA-256 of its exact original master CSV. Source service/report URLs are returned with evidence and appended to answers.

- 406 code-010/zero-improvement assessor-screened residential candidates, 6000–11000 square feet, Davidson County portions of eight assessor situs ZIP attributes. Not confirmed vacant, buildable or available.
- 9872 issued permit feed rows, deduplicated to 9864 permit numbers on query. Not starts/completions or units. Coverage 2023-11-19 through 2026-11-18; not all municipal authorities.
- 6542 assessment sale observations, reports published only through September2026. Not a complete deed chain, qualified land comps, or verified luxury new-build sales.

Source inputs: `integration/scout_nashville_candidate_master.csv`, `permits/normalized/issued_full.csv`, `sales/normalized/assessment_sale_history.csv` in the preserved compact package. Original files remain unchanged outside the app repository.

## Query behavior

Candidate queries support covered ZIP subsets, inclusive area bounds within the snapshot, exact APN/key, address substring and pagination. Counts are computed in code; listing status remains unknown. A deterministic shortlist token encodes filters and regenerates the same IDs. Out-of-coverage requests are explicitly rejected rather than silently narrowed or represented as zero.

Activity queries support ZIP, exact APN, date range and permit-subtype filtering. Return source rows and observed monthly counts, with missing-period and transaction-qualification limits. Never compute a builder land-price average from unqualified sales.

The conversation carries user-supplied filters forward, and the tool can regenerate exact IDs from a deterministic shortlist token. Persistent server-side shortlist storage is not claimed: the optional scout_events table was unavailable in the connected database. No database schema change was made. Saved history and cross-device continuity remain separate from these in-conversation tests.

Tool records are evidence, not instructions. The prompt distinguishes known from uncollected, requires use of connected records, prohibits invented local prices/rules/trends, and preserves candidate shortlists when buildability or sales suitability is unknown. Each source-backed answer receives a server-appended dated citation footer.

## Verification

Run `node tests/scout-records.cjs` and `node tests/scout-activity.cjs`. These verify deterministic counts, deduplicated flags, ZIP/area/date scope, exact APN matches, shortlist round trips and pagination. Type check/build and actual-model endpoint tests are separate checks. Model factual quality is not guaranteed by these deterministic tests.

This is a bounded first production connection, not a nationwide on-demand ingestion system. Zoning text, surveys/easements, utility confirmations, listings, economic datasets and verified comp qualification remain additional work. Original full source archives/rasters are not silently assumed available.

## Rollback

Revert the integration commit and redeploy the previous version. No schema migration or source-data deletion is required. Existing QA events can remain excluded by session prefixes; no customer records need restoring. Preserve original snapshot and evaluation artifacts.
