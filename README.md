# CareerOS web

Public interface: https://libbyix9-blip.github.io/jobtrackerrrr/

The CareerOS interface runs on GitHub Pages. It currently opens as an **interactive preview**, with no private backend connected. Application form changes last only in the current tab and reset on reload. Use synthetic sample information. No Gmail, live jobs, private documents, or personal database records are loaded. The existing private backend and local database remain separate and untouched.

## Development and publication

No dependencies are required. Use Node.js 24+, then run `npm run check`, `npm test`, and `npm run build`. The build copies an explicit public-file allowlist into `dist/`. Pages is configured to use GitHub Actions; pushes to main validate and deploy that artifact. Pull requests validate without publishing.

Every completed change gets a focused, reviewed, validated commit and clean push. Deployment success is verified separately; a source push is not a deployment claim.

## Backend work still required

Host the private Node API with durable storage and authenticated owner access. Establish an explicit trusted-origin and session strategy before making cross-origin API calls. Connect Gmail only through server-side OAuth with encrypted credential storage. Never put secrets or personal exports into this public repo. The public interface does not currently call any backend or transmit form inputs.
