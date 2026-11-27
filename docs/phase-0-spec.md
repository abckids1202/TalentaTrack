# TalentaTrack — Phase 0 product specification

## Product

TalentaTrack helps Indonesian SMA students find relevant, manually verified opportunities in AI, programming, research, and technology, save them, and keep track of deadlines. The core loop is: set a student profile → browse matching opportunities → inspect the official source → save a listing → see reminder timing.

The current build is a fixture-first product prototype. It demonstrates the full navigation and local workflow, but it has no accounts, shared database, or outbound reminder delivery. Real reminder delivery and authenticated admin access are launch requirements for a dependable public V1.

## Pages and user flows

| Route | Purpose | Main actions |
| --- | --- | --- |
| `/onboarding` | Collect the minimum matching profile | Pick SMA grade 10–12, 1–5 interests, province, optional city, individual/team/either preference, and WIB/WITA/WIT reminder timezone |
| `/opportunities` | Opportunity feed | Search, filter by category/selected interest, sort by match/deadline, open detail |
| `/opportunities/[slug]` | Opportunity detail | Review eligibility, delivery/location, cost, dates, verification notes, follow official source, save/unsave, toggle reminder preference |
| `/saved` | Saved list | Reopen active or closed saved listings and see planned reminder times |
| `/profile` | Edit student profile | Update the same fields as onboarding |
| `/admin` | Curator listing dashboard | Filter status, create/edit, verify and publish, archive, reset local demo data |
| `/admin/opportunities/new` | Create listing | Save draft or verify and publish |
| `/admin/opportunities/[id]` | Edit listing | Revise listing; edits save it back as a draft for re-verification |

First visit redirects to onboarding. A completed profile opens the feed. The feed/detail/save path is usable without admin actions. Admin edits affect only the current browser's local fixture copy.

## Opportunity data model

`src/lib/types.ts` defines the current TypeScript contract. A future Supabase `opportunities` table should use these fields, with snake_case column names and database constraints matching the enums and relationships.

| Field | Type / rule | Purpose |
| --- | --- | --- |
| `id` | UUID primary key | Stable identity |
| `slug` | Unique text | Human-readable detail URL |
| `title`, `organizer_name` | Required text | Listing identity |
| `summary`, `description` | Required text | Feed and detail copy |
| `category` | `competition`, `hackathon`, `research`, `program`, `scholarship` | Primary classification |
| `interest_tags` | Non-empty array of supported interest IDs | Matching and filtering |
| `eligible_grades` | Non-empty array of 10, 11, 12 | Hard eligibility check |
| `eligibility_notes` | Required text for published records | Explain grade, school, mentor, and team constraints |
| `participation_modes` | Non-empty subset of `individual`, `team` | Match participation preference |
| `delivery_mode` | `online`, `in-person`, `hybrid` | Activity format |
| `location_scope` | `online`, `national`, `province`, `city` | Geographic reach |
| `province`, `city` | Nullable text; required according to scope | Location filter/match |
| `application_open_date` | Nullable date | Opening date when stated by source |
| `deadline_kind` | `fixed`, `rolling`, `none` | Deadline behavior |
| `deadline_at` | Nullable `timestamptz`; required for `fixed` | Exact closing instant |
| `deadline_timezone` | Nullable supported IANA zone; required for `fixed` | Source's local timezone retained for display; WIB defaults to `Asia/Jakarta` |
| `cost_note` | Required text, including “not stated” when unknown | Avoid implying an opportunity is free |
| `official_source_url` | Required HTTPS URL | Authoritative evidence for the listing |
| `application_url` | Nullable HTTPS URL | Direct application link, if distinct from source |
| `publication_status` | `draft`, `published`, `archived` | Visibility/lifecycle state |
| `verified_at` | Nullable date/timestamp | Last manual source check |
| `verified_by` | Nullable curator/user reference | Audit attribution |
| `verification_notes` | Required for publication | What the curator checked |
| `created_at`, `updated_at` | Timestamps | Record history |

Related future tables: `student_profiles` (one row per authenticated student), `saved_opportunities` (unique student/listing pair, save time and reminder preference), and `reminder_deliveries` (scheduled offset, deadline snapshot, delivery state, attempts, and deduplication key). Keep delivery history separate so a changed deadline can be rescheduled and audited.

## What “verified” means

A listing can be published only after a curator checks the organizer's official source and records the source URL, verification date, curator, and concise verification notes. The check must confirm:

1. Organizer identity and opportunity title.
2. Eligible grade/school level and individual/team rules.
3. Activity format and geographic scope.
4. Application opening/closing dates, time, and timezone when provided.
5. Cost or an explicit note that cost is not stated.
6. Official source and application links use HTTPS and load.

Published listings older than 30 days since their last check are hidden from the student feed until re-verified. Fixed deadlines are stored as an exact instant plus the source's IANA timezone and are hidden immediately at or after that instant. A WIB-only source defaults to `Asia/Jakarta`. A published badge means these checks were performed; it is not a guarantee about organizer decisions or future changes.

## Version 1 match score

Eligibility is a hard gate: listings that do not include the student's grade are excluded from the feed. Eligible listings receive a transparent 0–100 score:

- Interest overlap: up to 60 points, split evenly across the student's selected interests.
- Location: same city and province 25; same province 20; national 15; online 15; other/unspecified local reach 5.
- Participation preference: 15 if the listing supports the selected preference or the student chose “either”; otherwise 0.

Sort by total score descending, then earliest exact deadline instant, then title. Deadline sort uses the earliest closing instant. Search and category/interest filters do not change the score. Feed cards show the score and listing interest tags; no machine learning or user behavior profile is used.

## Priorities

| Now | Later | Never for this product direction |
| --- | --- | --- |
| Student onboarding/profile; opportunity feed and detail; source links; save/unsave; transparent matching; local admin CRUD and verification workflow; local fixture data; reminder schedule preview; responsive editorial UI | Supabase auth/database; role-protected admin; scheduled email reminders and delivery log; reminder preferences; moderation/audit history; deployment and operational monitoring | Chatbot; payment; social feed; team matching; mobile app; broad web scraping; complex ML recommendations |

The public V1 promise “avoid missing deadlines” is not satisfied until reminder delivery, retry/deduplication behavior, and account recovery are implemented and monitored. The current preview deliberately says it does not send email.

## File structure

```text
src/
  app/                         Next.js App Router pages and global styles
    admin/                     Local curator dashboard and listing forms
    onboarding/                Profile setup
    opportunities/             Feed and [slug] detail route
    profile/                   Profile editing
    saved/                     Saved list and reminder preview
  components/                  Shared UI and forms
  lib/
    deadlines.ts               Exact deadline conversion, timezone, and cutoff helpers
    fixtures.ts                Seed opportunity data and option labels
    matching.ts                Eligibility, visibility, score, ordering
    reminders.ts               Local reminder-time preview calculation
    types.ts                   Product domain types
tests/                          Matching, deadline, and reminder unit tests
docs/                           Product and implementation notes
```
## Test plan

### Automated

- Matching: interest weighting, grade ineligibility, city/province matching, location and participation scoring, deterministic tie-breaking.
- Visibility: published status, verification freshness, expired deadlines.
- Deadline handling: exact-cutoff visibility and local-to-instant conversion for WIB, WITA, and WIT.
- Reminder previews: 7-day and 1-day timing, skipped past checkpoints, no previews for rolling/undated records.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before review.

### Manual acceptance

1. First visit redirects to onboarding; invalid profile submission shows an accessible error; valid profile opens the feed.
2. Feed counts and filters update; ineligible, stale, draft, archived, and expired entries do not appear.
3. Detail has a working official-source link, correct dates/timezone, eligibility, and save control.
4. Save/unsave persists after reload; saved list contains the selected item; reminder preview respects profile timezone and toggle.
5. Profile edits change matching results without losing saved items.
6. Admin can create a draft, edit it, reject invalid URLs/incomplete publication data, publish a complete record, and archive it. Editing a published listing requires re-verification.
7. Reset requires confirmation. Admin warns that it is local and not access-controlled.
8. Check keyboard focus, accessible labels/errors, reduced motion, and layouts at 320px, tablet, and desktop widths; verify no page-level horizontal overflow.

## Reliability risks

- Deadline, eligibility, price, or location changes after curation; stale records must expire from feed visibility and be rechecked.
- “Verified” can mislead if evidence notes are vague, the source is unofficial, or status remains published after an edit.
- Local storage is device/browser-specific and can be cleared; it is not a real account or reminder service.
- Reminder previews can be mistaken for delivered reminders. Production scheduling needs timezone tests, retry/de-duplication, delivery monitoring, and clear failure states.
- A public admin UI without server-side authentication/authorization lets anyone alter records.
- Too few listings or overly narrow filters may make the feed look empty; show clear empty states and curate enough coverage.
- Match weights and incomplete location data may overstate relevance; keep reasons visible and allow deadline sorting.
- External source links can move, fail, or become compromised; use HTTPS, recheck routinely, and open clearly labeled official domains.
- Student profile data concerns minors; collect minimal data, define retention/deletion, and review consent/privacy requirements before accounts or analytics.

## Implementation backlog

Each task has one reviewable outcome. P0-01 through P0-09 are implemented in the local prototype. P0-10 still needs its responsive, accessibility, and reliability acceptance pass. P1 tasks are planned and depend on configuring a real backend/provider.

| ID | Task | Acceptance / independent review |
| --- | --- | --- |
| P0-01 | Scaffold Next.js, TypeScript, Tailwind, and shared editorial shell | App starts; page shell and responsive navigation render |
| P0-02 | Define opportunity/profile types and seed fixtures | Typed fixture records load; draft listing remains hidden |
| P0-03 | Build onboarding and profile edit | Required fields validate; profile persists locally |
| P0-04 | Implement eligibility, verification visibility, score, and ordering | Unit tests cover weights, ineligibility, freshness, and tie breaks |
| P0-05 | Build opportunity feed with filters/search/sort | Feed updates for each control and has an empty state |
| P0-06 | Build detail and official source action | Detail renders required fields and opens source safely |
| P0-07 | Add save/unsave and saved list | Save state survives reload in the same browser |
| P0-08 | Calculate reminder previews and preference toggle | Offsets and WIB/WITA/WIT local times are correct; UI says no delivery is active |
| P0-09 | Build admin draft/edit/publish/archive flow | Invalid publication is blocked; edits return published listings to draft |
| P0-10 | Add responsive, accessibility, and reliability acceptance pass | Keyboard/320px checks pass; limitations are labeled |
| P1-01 | Create Supabase schema, constraints, and seed migration | Local Supabase migration applies and matches TypeScript contract |
| P1-02 | Add Supabase auth/session handling and student profile repository | Student data is server-backed and scoped by authenticated user |
| P1-03 | Add server-side role-protected curator operations | Non-admin users cannot create/edit/publish through UI or API |
| P1-04 | Move listing and saved-list reads/writes to Supabase | User flows persist across devices; row-level security tests pass |
| P1-05 | Add reminder queue and scheduled email delivery | Due reminders send once; retries and failure state are observable |
| P1-06 | Add provider configuration, consent/preferences, and deletion path | No secret is exposed to client; user can opt out and delete profile |
| P1-07 | Deploy to Vercel with production environment variables | Production smoke test covers onboarding through reminder delivery |

## Next recommended Code Mode task

Complete P1-01: create the Supabase schema, constraints, and seed migration, then review it against the TypeScript contract and publication requirements before wiring the UI to a backend.
