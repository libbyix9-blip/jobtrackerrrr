# CareerOS public interface

- This is the public frontend repository `libbyix9-blip/jobtrackerrrr`. The backend repository is private and separate.
- Make focused, descriptive commits for each completed behavior change. Review the exact diff, validate it, push every completed commit, and verify the remote head. Never force-push or overwrite unrelated work.
- Run `npm run check`, `npm test`, and `npm run build` before publishing changes. GitHub Pages deploys only the explicit build allowlist after checks succeed.
- Never commit personal application records, documents, résumé/letter contents, database files, exports, credentials, or backend configuration. Use synthetic test fixtures.
- The active UI uses a passphrase-protected encrypted vault. Browser edits persist encrypted locally; GitHub sync is on demand through chat. Never claim background Gmail sync or automatic upload of browser edits.
- The user explicitly authorized encrypted tracker data in GitHub. Only the versioned encrypted vault envelope may enter `inbox.enc.json`; never publish decrypted records, a passphrase, or an unencrypted private key. The public sync key and passphrase-encrypted private-key envelope are allowed. Gmail access remains in chat.
- Preserve the original local database and backend. No email sending or automated job submissions.
