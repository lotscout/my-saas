# Scout records-backed pilot

Date: 2026-11-19. Status: implementation proposal, not an installed data pipeline.

## Product direction

Customers are using LotScout for economic, policy, and land data. Start with real customer questions in one selected jurisdiction, then expand coverage based on demonstrated demand. Do not assume Colorado is the default market. Bobby will provide the pilot location and several test questions.

The differentiation is not that public records are secret or impossible to Google. It is collecting fragmented records, reconciling them, preserving history, and answering specific questions with evidence and reproducible calculations.

## Current implementation audit

- `app/api/advisor/route.ts` primarily answers from model knowledge; optionally enables web search. It has no government-record retrieval layer.
- Opt-in LotScout context contains marketplace/market-update summaries, not a verified public-record corpus.
- The web-search failure path retries without tools. That is not an acceptable substitute for evidence on a record-specific factual question.
- Questions are already written to `advisor_conversations` and `scout_events` (writes are best-effort). Reuse this demand signal; do not promise reliable tracking without checking write failures.
- `app/api/admin/scout-questions/route.ts` exists, but the landing-only proxy blocks that route and the admin UI. A protected research queue will require a narrow, authenticated route allowance, not reopening the full marketplace.
- Guest preview and free-user limits exist. Preserve current limits until pilot access is explicitly decided; do not silently make paid access free.
- Landing copy currently promises daily updates, verified data, and 90% less research. These claims need evidence and coverage-qualified wording before promoting this new records product. This mobile-only release does not change those claims.

## First useful slice

Choose one city/county, a bounded date range, and 5–10 real customer questions. Prefer a slice combining issued residential permits, planning/rezoning decisions, and adopted policy changes. Add economic datasets only when the pilot questions require them. If demand is economic-development-led rather than homebuilding-led, start with that demand instead.

Prioritize sources in this order: official downloadable files/API; official portal export; official documents/minutes; manual research; records request if necessary. Do not promise immediate answers to records requests. Keep proposed/adopted/effective/expired policy stages separate. A city is not its county; a multi-county municipality needs an explicit boundary.

## Storage: extend existing Supabase

Use the existing project initially, after checking capacity and access policies. No separate vector-database vendor is required for the pilot.

1. **Private Storage bucket `scout-records`**: original PDFs, CSVs, spreadsheets, and source snapshots. Immutable, content-hashed object paths. Preserve original files and extraction versions. Public-source URL remains the default user citation; authorized downloads may use short-lived signed links.
2. **Postgres structured tables**: permits, parcels, project approvals, policy events, and economic observations with typed dates/units/statuses. Numeric answers are computed with constrained SQL, not estimated from document snippets or embeddings.
3. **Document text and search**: extracted text with document/page/section anchors and full-text search. Add pgvector for semantic matching where useful; record embedding model/version and dimensions. Hybrid search combines exact references and semantic relevance.
4. **PostGIS when needed**: parcel geometry, municipal boundaries, proximity and intersection queries. Do not equate a ZIP code, city name, and county boundary.

Official implementation references:
- Storage: https://supabase.com/docs/guides/storage
- Storage access policies: https://supabase.com/docs/guides/storage/security/access-control
- Hybrid search: https://supabase.com/docs/guides/ai/hybrid-search
- Spatial queries: https://supabase.com/docs/guides/database/extensions/postgis

### Proposed entities (not yet migrated)

- `jurisdictions`: stable ID, type, state/county/place FIPS where available, official name, parent links, boundary version.
- `record_sources`: jurisdiction, agency, official URL, record type, acquisition method, publication cadence, terms, refresh target, last successful check, known limitations.
- `source_snapshots`: source ID, retrieval time, publication/coverage dates, original object path, SHA-256, parser version, row/page count, validation status, superseded snapshot reference.
- `records`: stable source record ID, jurisdiction, record type, source snapshot, published/event/effective dates, status, extracted fields, exact source locator, validation status. Unique source + source record ID + version; do not deduplicate on address alone.
- Typed child tables such as `permits` and `policy_events`: application vs issuance vs completion dates; permit count vs dwelling-unit count; proposed vs adopted vs effective dates. Economic observations retain period, unit, adjustment method, revisions and geography.
- `document_chunks`: snapshot, text, page/section anchors, full-text index, optional embedding and embedding version. Chunks are search aids, not the source of truth.
- `coverage`: jurisdiction + record type + date range, complete/partial/unknown, missing periods, validation evidence, last refresh, expected next check. Define exactly what completeness means for each source.
- `research_requests`: normalized question, requester/organization, jurisdiction, period, datasets needed, status, priority, linked source/collection jobs. Keep private customer context separate from reusable public records.
- `answer_runs`: question/version, source snapshots, retrieved record IDs, computation parameters, answer, limitations, model/prompt version, latency and cost. Limit access and retention of customer questions.
- `evaluation_cases` / `evaluation_results`: test question, as-of date, verified source bundle, expected result, acceptable uncertainty, run output and rubric scores.

Enable RLS on exposed tables. Public records and private customer queries need different policies. Keep service credentials on the server. Do not execute model-generated arbitrary SQL: use parameterized, constrained server functions. Treat retrieved text as evidence, not instructions. Respect source access conditions and avoid collecting unnecessary personal information.

## Demand-driven operation

1. User asks a specific question. Resolve geography, time range and requested metric; ask one clarification only when needed.
2. Check coverage before generation. If adequate, retrieve structured facts/documents and compose a source-linked answer.
3. If partial, answer only the covered portion and state the gap. If absent, say the records have not been collected; offer a research request instead of inventing an answer.
4. Record demand, deduplicate compatible requests, and prioritize by repeated questions, decision value, collection effort, and reuse potential. Do not copy private request details into another customer's answer.
5. A background job collects and validates records; human review handles ambiguous extraction and completeness. Never hold a chat request open for a long portal crawl.
6. Publish only validated coverage, rerun the question, and make the result available to the requester. Any email notification needs the user's consent and configured delivery.
7. Refresh according to source cadence and observed demand. Show last collected and covered-through dates, not a blanket claim that every record updates daily.

## Answer contract

Every record-specific answer includes: direct answer, jurisdiction and period, record IDs or reproducible calculation, source links with page/section anchors where available, source/collection dates, and coverage limitations. Separate observed fact, inference, and forecast. If a source is unavailable, stale, incomplete or contradictory, say so. Zero results never means zero activity without validated coverage.

## Pilot sequence and release gate

- Receive Bobby's questions and pilot location.
- Manually answer them from original official records to build a small gold-standard source bundle.
- Implement storage/schema and one collection adapter; verify counts, dates, duplicates and boundaries against the official export.
- Connect Scout retrieval and an explicit missing-coverage response. Keep the answer generator replaceable; a model swap alone does not add evidence.
- Run the saved question set against the same source snapshot; compare different generators only after retrieval is fixed.
- Release a clearly scoped pilot when all critical facts, citations, geography/time filters, and insufficient-data behaviors pass. Review failures before expanding jurisdictions.

No government-record ingestion, database migration, retrieval integration, or records-backed answer-quality certification has been performed by the mobile layout change.
