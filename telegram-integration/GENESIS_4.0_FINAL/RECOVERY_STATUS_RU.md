# GENESIS 4.1 Recovery — current status

- Base: GENESIS 4.0 FINAL COMPLETE (source code preserved).
- Original 3.1/4.0 archives: unchanged.
- Recovery-only compatibility copy: `source/iphone/` copied from `site/` so the server test suite can resolve the expected service-worker path.
- Server tests: 160/160 PASS after compatibility layout repair.
- PWA contract tests: 8/8 PASS using the matching 4.0 site source.
- JavaScript syntax checks: storage.js, sw.js, inline site script PASS.
- ZIP CRC: source archives PASS.
- Not run: npm ci, typecheck, Next production build, Prisma validation/generation, PostgreSQL migration/integration, browser/iOS E2E, backup restore drill, security review, deployment.
- No cloud deployment, external account connection, API key, or external data transfer performed.

This is a recovery/audit workspace, not a production release.
