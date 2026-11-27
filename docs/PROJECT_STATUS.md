# Project status

**As of:** 2026-11-27
**Stage:** Local, fixture-first product prototype. No production deployment or backend is verified.

## Implemented

- Next.js App Router shell, responsive-oriented editorial interface, and Indonesian-language routes.
- Student onboarding and profile editing for grade, interest tags, province/city, participation preference, and timezone.
- Three bundled opportunity fixtures (two marked published, one draft) with source URLs, eligibility, participation, cost, location, verification metadata, and exact deadline instant/timezone.
- Feed visibility gates for publication status, verification age, grade eligibility, and the exact fixed-deadline instant, including its timezone offset. Listings hide at cutoff; WIB-only sources default to Asia/Jakarta.
- Deterministic match scoring, search/filter controls, and sorting.
- Opportunity detail/source link, local save/unsave, saved-list view, and browser-local reminder preference.
- Admin draft/edit/publish/archive flow stored in browser `localStorage`; publishing checks required fields and rejects expired fixed deadlines.
- Unit tests cover matching, before/at/after a same-day WIB cutoff, past deadlines, WIB/WITA/WIT conversion and labels, offset-aware timestamp ordering, and reminder-preview calculations.

“Implemented” here means present in the local application and supported by the inspected code/tests. It does not mean production operations or organizer data are independently verified.

## Partial

- **Reminders:** the app calculates 7-day and 1-day preview times and lets the student toggle a local preference. No message is scheduled or delivered.
- **Verification:** curators can record source, notes, and a check date. Listings older than 30 days are hidden from the feed. There is no source monitoring, change detection, or server audit trail.
- **Persistence:** profile, saved items, and admin listing changes survive reloads in the same browser origin through `localStorage`, but are not shared, backed up, or account-scoped.
- **Quality assurance:** unit tests exist for core helper logic. No browser automation, end-to-end test suite, or completed manual accessibility/responsive acceptance report was found.

## Planned / not implemented

- Supabase schema and server-backed opportunity/profile/save persistence.
- Student authentication and server-enforced curator roles.
- Scheduled reminder delivery, retries, deduplication, delivery status, and failure monitoring.
- Consent, retention, and account/data deletion flows suitable for student accounts.
- Production deployment and operational monitoring.

The detailed sequence is in the [Phase 0 specification](phase-0-spec.md).

## Unverified

- Whether each fixture's organizer page, eligibility, fee, location, and deadline is still current. `verifiedAt` is fixture metadata and is not proof of a live source check today.
- Production deployment, domain, environment configuration, or runtime reliability.
- Cross-browser behavior, screen-reader behavior, and responsive acceptance at the specified 320px/tablet/desktop widths.
- Real-user usability and whether the match weights produce useful results with a larger catalogue.

## Main blockers

1. The admin route has no authentication or server authorization; any visitor to a deployed instance could change browser-local listings.
2. There is no shared persistent store, so student saves and curator edits are isolated to one browser.
3. There is no reminder delivery, so the product's “avoid missing deadlines” promise is not fulfilled for real users.
4. Fixture metadata and freshness rules cannot detect an organizer changing a deadline or closing a listing early.

## Recommended next tasks

1. Add server-enforced authentication and curator authorization before exposing admin operations beyond a local demo.
2. Implement the Supabase schema and row-level security, then move profiles, listings, and saved opportunities from browser-only state to repositories backed by the database.
3. Implement a scheduled reminder delivery path with explicit consent/preferences, deadline-change handling, retries, deduplication, and observable delivery failures.
