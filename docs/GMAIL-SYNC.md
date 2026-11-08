# Gmail refresh

The primary flow is direct, on-demand browser access using Google Identity Services. No paid host, client secret, API key or server is needed.

## One-time Google setup

1. Create a Google Cloud project and enable Gmail API.
2. Configure Google Auth Platform branding and External audience, in Testing. Add the owner as a test user.
3. Create an OAuth Web application client with authorized JavaScript origin `https://libbyix9-blip.github.io` (no repository path). The popup token flow requires no redirect URI.
4. Save the public client ID in tracker Settings. Never enter a client secret.
5. Select Refresh Gmail and authorize only Gmail readonly access. Google may require authorization again after expiry. A personal testing app can have Google consent/verification notices; the owner handles those directly.

Reference: https://developers.google.com/identity/oauth2/web/guides/use-token-model

## Behavior and limits

Refresh searches a six-month initial window, then overlaps the previous completed check by seven days. This includes archived confirmations and incoming inbox recruiting conversations. It excludes sent mail, drafts, spam and trash. Keyword search and conservative rules can miss unusual wording; this is not an AI review of every message. No sending, labeling, opening attachments or automated replies.

Up to 500 search results per click, in pages of 50. A fixed window and page cursor are saved encrypted after each fully fetched page. More results can be continued with another Refresh. Failed pages are retried without advancing their cursor; previously completed pages remain saved. New recruiting conversations, ambiguous entity matches and conflicts with manual edits enter To review. Confirmed thread matches can update existing applications; original application dates are preserved. Outreach can be saved without an application date. Each review can be linked manually to an existing application.

Access tokens stay in memory, expire and clear on Lock. Decrypted message bodies are used only for classification and are not persisted or published. Extracted subjects, contacts, source IDs and tracker records save encrypted locally. Direct updates do not upload to GitHub automatically. Download encrypted backups to preserve changes across devices.

## Legacy chat imports

Chat can still read relevant Gmail messages on request, prepare minimal structured records in a private directory outside this public checkout, and encrypt them with the public sync key using `scripts/encrypt-import.mjs`. Only the validated encrypted `inbox.enc.json` may be committed. Keep personal data out of source, tests and commit messages. Load published updates from Settings → Previous chat imports. Never ask for the owner's passphrase or publish plaintext private keys.
