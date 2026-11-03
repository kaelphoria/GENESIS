# GENESIS — Secure Artifact Storage Design 0.1

**Status: design only. Binary uploads remain disabled.** The current Artifact API registers metadata and explicitly stores neither file bytes nor a content hash.

## Storage boundary

- Store objects outside the web application public directory.
- Use private per-owner object keys; never derive object keys directly from a client-supplied path.
- Keep bucket/container private. No public object URLs.
- Authorize every read, download, update and delete against the authenticated owner.
- Use short-lived signed download URLs only after owner authorization; default lifetime target: 60 seconds.
- Encrypt at rest using maintained storage encryption; keep keys separate from object data and rotate them.

## Ingestion pipeline

1. Authenticate user and enforce same-origin mutation protection.
2. Enforce a 25 MiB initial per-file limit and a bounded per-user quota.
3. Accept an explicit allow-list only: PDF, PNG, JPEG, WEBP, TXT, Markdown, CSV, DOCX and XLSX.
4. Validate extension, declared MIME and file signature; never trust the browser MIME header alone.
5. Generate the storage key server-side; stream to a private quarantine area.
6. Compute SHA-256 on the server while streaming; do not accept a client-provided hash as evidence.
7. Run malware scanning and archive-bomb limits before changing status to `active`.
8. Persist provenance, byte size, detected media type, hash, storage key and scan outcome atomically with lifecycle state.
9. Serve downloads as attachments with `X-Content-Type-Options: nosniff`; do not inline HTML, SVG or executable content.
10. On deletion, revoke access immediately and enqueue object deletion with retryable, auditable state.

## Excluded from initial upload support

- Executables, scripts, HTML, SVG, archives, disk images, installers, password-protected documents and unknown formats.
- Public sharing, anonymous downloads, remote URL ingestion and model-triggered uploads.

## Release blockers

- Private storage provider and credentials are not configured.
- Malware scanning service/engine and quarantine workflow are not connected.
- No object deletion/retry worker or retention settings exist.
- No live upload/download integration tests or backup/restore tests exist.

Do not enable an upload route until all blockers have a verified implementation.
