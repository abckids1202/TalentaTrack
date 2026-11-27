# Security and data

## Data the prototype stores

The browser profile contains grade, interest tags, province/city, individual/team preference, and reminder timezone. Saved records contain an opportunity ID, save timestamp, and local reminder-enabled flag. Admin edits can store opportunity descriptions, organizer/source/application URLs, eligibility, cost, location, deadline, publication status, and curator verification notes.

## Where data is stored

The current provider serializes the profile, saved records, and opportunity-list snapshot into browser `localStorage` under:

- `talentatrack:profile`
- `talentatrack:saved`
- `talentatrack:opportunities`

There is no server database or account association. Clearing browser data removes the local state. The built-in reset clears these three app keys.

## Authentication and authorization

There is no authentication or authorization. `/admin` and its create/edit actions are client routes. Publication checks run in the browser and can be bypassed by editing local state. Do not use this demo to manage real listings on a public deployment.

## Secrets and configuration

No application environment-variable references were found in the inspected source or configuration. No `.env.example` is needed for the current local prototype. `.gitignore` excludes `.env*` files while allowing a future `.env.example`. Do not commit credentials, tokens, private environment files, or generated local data if integrations are added later.

## Reliability and privacy limits

- Profile data describes students who may be minors. Although the prototype asks for no name or email, location and interests still deserve careful handling. Define consent, access, retention, and deletion before collecting real users' data.
- `localStorage` is accessible to scripts running on the same origin and to the person using the browser profile. It is not protected server storage or a backup.
- A source URL and verification note document a manual check; they do not prove the current organizer page is authoritative or unchanged. The app does not monitor source pages. The 30-day freshness gate only uses the stored check date.
- Exact deadline instants and Indonesian timezones are represented in the local listing model. A deadline can still become stale if an organizer changes it after review.
- Reminder controls and timestamps are local previews. No notification is sent, and delivery failures cannot be observed.
- The client-only publication form is not a trust boundary. A production curator workflow needs server-side validation, authenticated roles, audit history, and protected storage.

No security, privacy-law, or production-readiness audit has been performed.
