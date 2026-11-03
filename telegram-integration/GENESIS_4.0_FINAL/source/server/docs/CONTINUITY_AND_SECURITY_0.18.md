# GENESIS 0.18 — Continuity and Security Batch

## Implemented in this batch

### Durable import-preview receipt ledger
- Import preview remains non-mutating with respect to personal domain records.
- Each valid preview creates a short-lived, signed, user-bound, exact-payload-bound receipt and persists its nonce in `ImportPreviewReceipt`.
- A future apply operation must call `consumeImportPreviewReceipt` inside the same database transaction as the apply. The conditional `updateMany` compare-and-set allows exactly one successful consumer.
- The receipt ledger is excluded from portable account exports because it is ephemeral security metadata.
- Expired receipt cleanup is dry-run by default and requires a separate confirmation environment variable plus `--apply`.

### Bounded import body handling
- Preview reads the request stream with a hard 10 MiB byte cap, including chunked requests without a trustworthy Content-Length.
- Preview requests are rate-limited to 8 per user per minute through the durable hashed-key limiter.
- UTF-8 decoding is strict. Oversized and malformed requests fail before JSON parsing and before receipt creation.

### Backup envelope hardening
- AES-256-GCM envelope rejects payloads above 25 MiB.
- Associated data is non-empty and bounded to 256 UTF-8 bytes.
- IV, tag and ciphertext require canonical base64url encoding and bounded decoded sizes before decryption.
- Authentication and plaintext SHA-256 checks remain mandatory.

### Private artifact quarantine foundation
- Added a storage adapter that detects a narrow allowlist of file signatures (PDF, PNG, JPEG, WebP, JSON and plain text) instead of trusting client MIME labels.
- Enforces a 10 MiB cap, server-side SHA-256, opaque owner-partitioned identifiers, private directory/file permissions and path traversal / symlink checks.
- Every stored object is marked `quarantined` and `downloadable: false`; there is no public serving path and no scan-clean transition yet.
- The adapter is not wired to the Artifact API. Binary uploads remain disabled until a malware scanner, persistent scan state, transactional metadata binding and deletion/restore integration are tested.

### MCP protocol hardening
- Initialization cannot be completed by a notification sent before `initialize`.
- Reinitialization resets the session handshake.
- JSON-RPC IDs and params are validated; tool arguments have a 32 KiB serialized limit.
- Tool errors remain sanitized and no data-writing tools are exposed.
- stdio parser enforces the line limit for both complete and trailing partial frames.

## Deliberately not enabled
- Import apply is still not exposed. Receipt consumption helper is ready for transaction integration, but restore/backup persistence and conflict semantics still need end-to-end DB tests.
- Artifact binary upload and download remain disabled. Existing Artifact records are metadata-only; no raw file storage is claimed.
- No retention policy automatically deletes user-authored records.
- No remote MCP HTTP endpoint, OAuth authorization server, tunnel, public deployment or external connector was activated.

## Required integration gates
1. Apply migration `202611030012_import_receipt_ledger` on a disposable PostgreSQL database.
2. Generate Prisma client and run semantic TypeScript check / production build.
3. Test concurrent receipt consumption with real PostgreSQL transactions.
4. Test oversized chunked request handling in the actual Next.js runtime.
5. Verify backup restore and deletion drills before enabling import apply or file storage.
