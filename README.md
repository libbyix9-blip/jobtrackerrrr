# CareerOS · One step closer

Live website: https://libbyix9-blip.github.io/jobtrackerrrr/

A light sage-green application tracker with three views: Applications, To review, and Workspace. No backend hosting or paid server is required. Gmail is read through the owner's existing chat connection, on request. The website never receives Gmail credentials.

## First use

1. Create a passphrase of at least 8 characters on the website. Never send it to chat.
2. The browser creates an RSA-OAEP key pair and encrypts the private key with a passphrase-derived AES key. The downloaded `careeros-sync-key.json` contains only the public encryption key and encrypted private-key envelope.
3. Ask chat to check Gmail and use the downloaded sync key. Chat can encrypt updates using the public key without knowing the passphrase.
4. Only `inbox.enc.json`, containing an encrypted envelope, is committed and published. Open the page and load the latest update to decrypt it locally.

Application edits persist encrypted in this browser. They are not automatically pushed to GitHub. Download an encrypted backup after edits; ask chat to publish that backup to carry edits across devices. Browser storage can be cleared; backups and the latest published snapshot are the recovery sources. Keep the passphrase separately: it cannot be recovered or reset.

## Privacy and synchronization

Vault version 1 uses PBKDF2-SHA256 (600,000 iterations, random 16-byte salt), AES-256-GCM (random 12-byte IVs), and RSA-OAEP/SHA256 with 3072-bit keys. Snapshot AES keys are wrapped with the public key. The private key is imported non-extractably after unlocking. No plaintext records, passphrase, OAuth tokens, or unencrypted private keys belong in this repository. Lock clears decrypted application state from the UI; the app also locks after 15 minutes of inactivity.

Gmail imports keep distinct roles separate, attach source-message links, and route uncertain role/date matches to review. Imports deduplicate stable record IDs; manual status edits and dismissed items survive repeated imports. Existing local CareerOS records/documents are not altered. Email bodies and attachments are not included in tracker snapshots.

Daily unattended Gmail checks are not configured. Ask chat when you want an update. Gmail connection availability and account-plan limits still apply; no additional hosting subscription is used by this implementation.

## Development and publication

Node.js 24+, no dependency installation required:

- `npm run check`
- `npm test`
- `npm run build`

The build clears stale artifacts and packages an explicit public allowlist. It optionally adds only a structurally validated encrypted inbox envelope. GitHub Actions validates main pushes before Pages deployment; PRs validate without publishing.

To prepare an encrypted import, keep the private plaintext JSON outside this checkout and run `node scripts/encrypt-import.mjs /absolute/path/careeros-sync-key.json /absolute/private/path/import.json`. The script writes only `inbox.enc.json`. Review its shape and repository diff before committing. Never print or commit decrypted data.

Each completed change gets a focused, validated commit and clean push. Verify the remote head and deployment separately.
