# TalentaTrack

TalentaTrack is a fixture-first opportunity tracker prototype for Indonesian SMA students interested in AI, programming, research, and technology. It demonstrates how a student can set preferences, browse matching listings, open organizer sources, save an opportunity, and preview reminder timing.

## Current stage

This is a local prototype, not a production service. Its three opportunity records are bundled fixtures: two have a published status and one is a draft. The published fixtures carry a recorded check date of 2026-11-26; the project does not automatically confirm that their sources or deadlines remain current.

## What works in the prototype

- Onboarding and profile editing for grade, interests, province/city, individual/team preference, and reminder timezone.
- An opportunity feed with search, category/interest filters, match scoring, and deadline sorting.
- Detail pages with eligibility, cost, location, exact deadline timezone, and organizer-source links.
- Save/unsave and a saved-opportunity list.
- A local reminder schedule preview for fixed deadlines.
- A browser-local admin flow to draft, edit, publish, and archive fixture listings.

Profile, saved-list, reminder-toggle, and listing edits are stored in this browser's `localStorage`. They do not sync across devices or users.

## Known limitations

- No database or server-backed persistence is connected.
- There is no authentication or authorization. The admin route is client-side and must not be exposed as a production admin tool.
- Reminder dates are calculated for display only. No email, push, or browser notification is sent.
- Listing verification is a manual curator workflow. Source URLs and recorded check dates do not guarantee that an organizer has not changed an opportunity.
- This repository contains a small fixture set, not a live or comprehensive opportunity catalogue.
- No deployment configuration or production deployment was verified.
- Browser/end-to-end accessibility and responsive acceptance checks have not been completed as part of this documentation pass.

## Technology

- Next.js 16 App Router, React 19, and TypeScript 6
- Tailwind CSS 4 through the PostCSS integration
- Vitest for unit tests and ESLint for linting

## Prerequisites and setup

Install a Node.js/npm version compatible with the versions in `package.json`, then run:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With no saved profile, the app routes to onboarding. Browser storage can be cleared from the admin demo reset control.

No environment variables are referenced by the current application or required for local development. A `.env.example` is therefore not included.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Redirects to onboarding or the opportunity feed based on local profile state |
| `/onboarding` | Create the local student profile |
| `/opportunities` | Browse, search, filter, and sort listings |
| `/opportunities/[slug]` | Review a listing, open its official source, save it, and toggle its local reminder preview |
| `/saved` | Revisit saved listings and inspect reminder timing previews |
| `/profile` | Edit student preferences |
| `/admin` | Manage local fixture listings |
| `/admin/opportunities/new` | Create a local listing |
| `/admin/opportunities/[id]` | Edit a local listing |

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

See [Project status](docs/PROJECT_STATUS.md), [Architecture](docs/ARCHITECTURE.md), [Security and data](docs/SECURITY_AND_DATA.md), and the [Phase 0 specification](docs/phase-0-spec.md) for verified implementation details and next steps.

Deployment is unverified. No production URL, Vercel project configuration, database, or notification provider is included in the repository.
