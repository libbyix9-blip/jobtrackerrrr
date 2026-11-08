# CareerOS · One step closer

Live website: https://libbyix9-blip.github.io/jobtrackerrrr/

A light sage-green job tracker with Applications, To review, and Settings. Refresh Gmail reads confirmations, incoming recruiting outreach, interview invitations and follow-ups directly in the browser. No paid backend is required.

## First use

1. Unlock or create your encrypted tracker. Keep your passphrase private.
2. Complete the one-time Google OAuth setup in [Gmail setup](docs/GMAIL-SYNC.md), then save the public client ID in Settings.
3. Select **Refresh Gmail**, authorize read-only Google access, and review unclear matches in **To review**.
4. Link incoming conversations to existing applications or save a new conversation without inventing an application date.

Application edits persist encrypted in this browser. They are not automatically pushed to GitHub. Download an encrypted backup after edits; ask chat to publish that backup to carry edits across devices. Browser storage can be cleared; backups and the latest published snapshot are the recovery sources. Keep the passphrase separately: it cannot be recovered or reset.

## Privacy and synchronization

Vault version 1 uses PBKDF2-SHA256 (600,000 iterations, random 16-byte salt), AES-256-GCM (random 12-byte IVs), and RSA-OAEP/SHA256 with 3072-bit keys. Snapshot AES keys are wrapped with the public key. The private key is imported non-extractably after unlocking. No plaintext records, passphrase, OAuth tokens, or unencrypted private keys belong in this repository. Lock clears decrypted application state from the UI; the app also locks after 15 minutes of inactivity.

Gmail imports keep distinct roles separate, attach source-message links, and route uncertain role/date matches to review. Imports deduplicate stable record IDs; manual status edits and dismissed items survive repeated imports. Existing local CareerOS records/documents are not altered. Email bodies and attachments are not included in tracker snapshots.

Checks run when you press Refresh Gmail, not on an unattended schedule. Keyword search and conservative rules can miss unusual messages. Up to 500 results are checked per click; larger checks continue on the next click. Google consent and API limits apply. See the setup guide for pagination, privacy and recovery behavior.

## Development and publication

Node.js 24+, no dependency installation required:

- `npm run check`
- `npm test`
- `npm run build`

The build clears stale artifacts and packages an explicit public allowlist. It optionally adds only a structurally validated encrypted inbox envelope. GitHub Actions validates main pushes before Pages deployment; PRs validate without publishing.

To prepare an encrypted import, keep the private plaintext JSON outside this checkout and run `node scripts/encrypt-import.mjs /absolute/path/careeros-sync-key.json /absolute/private/path/import.json`. The script writes only `inbox.enc.json`. Review its shape and repository diff before committing. Never print or commit decrypted data.

Each completed change gets a focused, validated commit and clean push. Verify the remote head and deployment separately.
