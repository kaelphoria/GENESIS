# GENESIS Universe 3.0 — Personal Local Release 1.0

**Release type:** single-owner, local-first personal PWA  
**Data model:** local schema v4  
**Primary target:** iPhone Safari / Add to Home Screen; desktop browser supported  
**Product principle:** AI expands. Human decides. Human remains the author.

## Product surface

Universe 3.0 is the single user-facing home for the personal local build. It combines:

- Universe command center and an interactive nine-world system map.
- Nine Worlds: subjective assessment, intention, focus, next step, dated assessment history.
- Personal Model: values, direction, focus and preferred support.
- Goals: life-domain association, time horizon, reason and status.
- Projects: world and goal association, description, progress and status.
- Actions: create, search, priority, due date, edit, complete and delete; each action can be linked to a goal and project.
- Personal Memory: user-entered notes, categories, search, edit and delete.
- Decisions: context, chosen path, alternatives, risks and review date.
- Life Timeline: chronological projection of goals, projects, actions, memory and decisions.
- ORACLE Context Workspace: user-controlled, opt-in selection of personal context (all context switches default off), structured prompt preparation and local prompt history.
- JSON import/export and password-protected encrypted backup.
- PWA manifest, offline app shell, localStorage plus IndexedDB snapshot durability layer.

## Local data schema v4

`genesis01` retains the existing schema-v3 fields and adds `goals`, `projects`, `decisions` and `oracleSessions`. Normalization migrates old local snapshots by preserving known v3 fields and initializing the new collections as empty. The import path accepts backup schema versions through v4 and creates a safety export before replacing existing records.

## Privacy boundaries

- Application records remain in the current browser origin using localStorage and an IndexedDB snapshot.
- No automatic network transmission, server sync or account registration is present in this release.
- ORACLE does not pretend to be a live model: it assembles a prompt from context explicitly selected by the user. The prompt is copied manually to a model of the user's choice.
- Browser storage is not encrypted at rest by this application. The encrypted export is AES-256-GCM with a PBKDF2-SHA256-derived key (310,000 iterations), random 16-byte salt and random 12-byte IV. The password is not stored. Losing it makes the backup unrecoverable.
- Plain JSON export remains available and is not encrypted.
- Service Worker caches only the static app shell. It does not cache authenticated API responses or personal records.

## Deliberately not claimed as complete

- Live ORACLE inference / server-side AI gateway connection.
- Backend authentication, PostgreSQL persistence, cloud sync or cross-device continuity.
- App-level encryption of live browser records.
- Voice interface, external connectors, proactive background agents or autonomous external actions.
- Production deployment behind a private access gateway.

The separate server branch contains backend and AI foundations, but the local PWA is not yet wired to that server. This avoids placing provider keys in the browser or silently transferring private records.

## Verification performed for this release

- Browser smoke scenario: 9 world nodes render; navigation reaches each view; goal/project/decision/action/memory creation works; Life Timeline aggregates the new records; ORACLE prepares a context prompt; world detail opens; zero page errors.
- Desktop screenshot review completed.
- iPhone-sized 390px viewport review completed; document width remains 390px with no horizontal page overflow.
- Node syntax validation passed for inline app JS, `storage.js`, and `sw.js`.
- Built-in release verifier checks nav/view parity, nine canonical worlds, PWA manifest, cache version and local-only storage adapter.
- WebCrypto AES-GCM/PBKDF2 backup round-trip and wrong-password rejection verified independently using Node WebCrypto. Browser-side WebCrypto requires HTTPS; the opaque-origin browser harness cannot exercise `crypto.subtle`.
- Real iPhone Safari installation and iOS persistence remain to be confirmed on the user's device after private HTTPS hosting.

## Installation

Serve the folder on HTTPS behind private access control, open it in Safari, then use Share → Add to Home Screen. Before using real personal data, create an encrypted backup and store the passphrase separately. Keep the same origin during updates; browser data is origin-bound.
