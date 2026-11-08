# CareerOS public interface

- This is the public frontend repository `libbyix9-blip/jobtrackerrrr`. The backend repository is private and separate.
- Make focused, descriptive commits for each completed behavior change. Review the exact diff, validate it, push every completed commit, and verify the remote head. Never force-push or overwrite unrelated work.
- Run `npm run check`, `npm test`, and `npm run build` before publishing changes. GitHub Pages deploys only the explicit build allowlist after checks succeed.
- Never commit personal application records, documents, résumé/letter contents, database files, exports, credentials, or backend configuration. Use synthetic test fixtures.
- The current UI is an in-memory preview. Do not describe it as a durable, authenticated tracker. Keep the backend-disconnected notice visible until a hosted private backend is implemented and verified.
- Preserve the original local database and backend. No email sending or automated job submissions.
