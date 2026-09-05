# ADR-007: Public uploads vs private secure files

## Status

Accepted

## Context

Product/store/customer images may be publicly readable, but seller documents and private customer documents must not be world-readable via static URLs.

## Decision

- Public assets are served under Nest `/uploads/*` (static mount)
- Private upload subdirectories blocked at the static layer (404): **`sellers`**, **`customer-documents`** (`PRIVATE_UPLOAD_SUBDIRS` in `file.constants.ts`)
- Typical public subdirs: `products`, `stores`, `customers` (avatars/covers)
- Authorized access to private files goes through Nest `GET /files/secure/:fileId` and, where needed, the admin BFF proxy `client/src/app/api/v1/admin/files/secure/[fileId]`
- Associations use `StoredFile` hub + `ProductFile` / `UserFile` / `StoreFile` / `SellerDocument`

`resolveUploadUrl` is for turning public `/uploads/...` paths into absolute URLs for Next Image — **not** for private documents.

## Why

Historical rationale is not documented. Enforced in Nest static setup, files module constants, and walkthrough “Static / Files” sections.

## Consequences

- New private document types must use secure download, not public `/uploads` links
- Admin review of seller docs should use the secure proxy pattern already present

## AI Guidance

- MUST NOT expose seller documents or `customer-documents` via public static paths
- MUST follow existing `files` module + storage multer helpers for uploads
- MUST reuse secure download endpoints for private content
- MUST NOT use `resolveUploadUrl` / public `/uploads` for private associations

## Related Code

- `server/src/modules/files/` (especially `constants/file.constants.ts`)
- `server/src/integrations/storage/`
- `server/src/main.ts` (static `/uploads/` + private subdir blocking)
- `client/src/app/api/v1/admin/files/secure/[fileId]/route.ts`
- `client/src/lib/resolve-upload-url.ts`
