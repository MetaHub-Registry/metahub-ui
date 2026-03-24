# MetaHub UI

Web frontend for [metahub-api](https://gitlab.com/qnib-golang/metahub-api) -- a container image registry with profile-aware image indexes.

Built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.

## Features

- **Authentik login** -- OIDC authentication via metahub-api's Authentik integration
- **Collection browser** -- hierarchical navigation of container image collections with breadcrumbs, search/filter, and drill-down to individual tags
- **Profile filtering** -- select a profile (e.g. `generic`, `zen3`, `strix-halo`) to see which images in a collection match that profile's OCI image index
- **Registry credentials** -- create/revoke registry tokens and get a ready-to-copy `docker login` command

## Development

### Prerequisites

- Node.js 20+
- A running `metahub-api` instance (default: `http://localhost:8080`)

### Setup

```bash
npm install
npm run dev
```

The Vite dev server starts at `http://localhost:5173` and proxies `/api/` requests to `http://localhost:8080` (configurable in `vite.config.ts`).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests (Vitest) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint with ESLint |

### Testing

```bash
# Run tests
npm test

# Run with coverage (generates coverage/lcov.info for SonarQube)
npm run test:coverage
```

Coverage output:
- `coverage/lcov.info` -- LCOV format (for SonarQube)
- `coverage/lcov-report/index.html` -- HTML report (open in browser)

### SonarQube

```bash
# Generate coverage first
npm run test:coverage

# Submit to SonarQube
./misc/bin/sonar.sh
```

The script reads `SONAR_QUBE_URL`, `SONAR_QUBE_TOKEN`, and `SONAR_QUBE_PROJECT` from `.env`.

## Deployment

### Docker

Build and run as a container:

```bash
docker build -t metahub-ui .
docker run -p 8082:80 -e METAHUB_API_URL=https://api.metahub.example.com metahub-ui
```

The `METAHUB_API_URL` environment variable configures which metahub-api instance the frontend talks to. It is injected into the built JavaScript at container startup.

### docker-compose

For local development with metahub-api:

```bash
docker compose up
```

This starts:
- `metahub-ui` on port `8082`
- `metahub-api` on port `8080` (with CORS enabled)

### nginx

The container serves the SPA via nginx with:
- SPA fallback (`try_files $uri /index.html`) so client-side routing works
- Aggressive caching for `/assets/` (hashed filenames, 1 year expiry)
- No-cache for `index.html` (so deployments take effect immediately)

No API reverse proxy -- the frontend communicates with metahub-api cross-origin (CORS must be enabled on the API: `cors.enabled: true`).

## Configuration

### API URL

The frontend resolves the metahub-api base URL in this order:

1. **Runtime config** -- `METAHUB_API_URL` env var (set at container startup via `docker-entrypoint.sh`)
2. **localStorage override** -- `metahub_api_base_url` key (useful for development/debugging)
3. **Same-origin fallback** -- empty string (works with the Vite dev proxy)

### Profiles

Profile definitions are currently static (`src/data/profiles.ts`). A future `GET /api/v1/profiles` endpoint on metahub-api will replace this with dynamic data -- at that point the change is a one-line swap in the data fetching layer.

### Authentication

The frontend uses metahub-api's OIDC flow:
1. User clicks Login, browser redirects to `/api/v1/login`
2. metahub-api redirects to Authentik
3. After authentication, Authentik redirects back to metahub-api's callback
4. metahub-api redirects to the frontend's `/callback#access_token=<token>`
5. The frontend extracts the token and uses it as a Bearer token for protected API calls

The access token is stored in `sessionStorage` (cleared when the tab closes).

## Project Structure

```
src/
  components/       # Reusable components (Layout, Breadcrumbs, CopyButton, etc.)
  components/ui/    # shadcn/ui generated components
  contexts/         # React contexts (AuthContext)
  data/             # Static data (profiles)
  lib/              # API client, utilities
  pages/            # Route page components
  test/             # Test setup and utilities
```
