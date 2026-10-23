# Context: metahub-ui

> This file helps AI agents understand the repo quickly.
> Updated after each session that modifies this repo.

## What This Repo Is

The React/TypeScript frontend for MetaHub. Provides collection
browsing, profile viewing, manifest detail, and ORAS artifact views.
Built with Vite, uses shadcn/ui components and Tailwind CSS.

## Architecture

```
src/
  App.tsx                    Route definitions (React Router)
  main.tsx                   Entry point
  pages/
    Collections.tsx          Collection list with filter/search
    CollectionDetail.tsx     Collection leaf: tags and manifests
    Profiles.tsx             Profile card grid
    OrasArtifacts.tsx        ORAS artifact listing
    OrasArtifactDetail.tsx   ORAS artifact detail
    Landing.tsx              Landing page
    Login.tsx                Login page
    Callback.tsx             OAuth callback
    Settings.tsx             User settings
  components/
    Breadcrumbs.tsx          Breadcrumb navigation for collections
    ProfileSelector.tsx      Profile filter dropdown
    Layout.tsx               Page layout wrapper
    ProtectedRoute.tsx       Auth-gated route wrapper
    CopyButton.tsx           Copy-to-clipboard button
    ErrorBoundary.tsx        Error boundary
    GodModeLoginForm.tsx     Dev bypass login
    ui/                      shadcn/ui primitives (card, button, badge, etc.)
  contexts/
    AuthContext.tsx           Authentication state
  data/
    profiles.ts              Profile data/definitions
  lib/
    api.ts                   API client (all backend calls)
    utils.ts                 Utility functions
  test/
    setup.ts                 Vitest setup
    test-utils.tsx           Test helpers
```

## Key Patterns

### Routing

Routes are defined in `App.tsx` using React Router. Collection
browsing uses nested path segments:
- `/collections` → collection list
- `/collections/:segment1/:segment2/...` → breadcrumb walk
- `/collection/:id/tag/:tagId` → leaf detail (currently graph-ID based)

### API Client

All backend calls go through `src/lib/api.ts`. The API base URL
comes from environment config. Responses are typed.

### Profile Selection

`ProfileSelector.tsx` renders a dropdown that's supposed to filter
collections by profile. Currently broken — shows `cpu` entries
and selection has no effect.

### UI Components

Uses shadcn/ui (`src/components/ui/`) for primitives. Custom
components wrap these with MetaHub-specific logic.

## Testing

```bash
npm test                     # or: npx vitest run
```

Coverage: `coverage/lcov.info`. Tests live alongside source files
as `*.test.tsx` / `*.test.ts`.

## Recent Changes

- Display `content_size` instead of manifest document size
- Dev versioning with `-devN` suffix in package.json
- SonarQube version auto-detection

## 2026-04-18 (ui-and-manipulation session)

### What changed
- **`profile-detail-manipulations`**: `/profiles/:label` now renders a
  Manipulations section below the rules list using a new reusable
  `<ManipulationCard>` (collapsible, covers default + variants + the
  legacy flat-layers form). `api.ts` gains matching interfaces.
- **`collection-manifest-expand`**: `ManifestRow` inside
  `CollectionDetail.tsx` became a collapsible card that reveals
  config, annotations and layers inline on click. Profile badges are
  now `<Link>`s to the profile detail page. Upstream (when present)
  shows up with a copy button on the header line.
- **Tests**: 3 new cases on `CollectionDetail.test.tsx` (upstream,
  profile link navigation, expand reveal) plus a brand-new
  `ProfileDetail.test.tsx` (empty state, extended shape, legacy
  shape). Total suite: 223/223 green. `npm run build` passes.

### Key files
- `src/components/ManipulationCard.tsx` — new
- `src/pages/ProfileDetail.tsx` — new Manipulations section
- `src/pages/CollectionDetail.tsx` — expandable rows + profile links
- `src/lib/api.ts` — `ApiDescriptor`, `ApiManipulation*` types;
  extended `Manifest` and `ProfileDetailResponse`
- `src/pages/CollectionDetail.test.tsx`,
  `src/pages/ProfileDetail.test.tsx` (new)

### Gotchas
- `data-testid="manifest-row"` and `data-testid="profile-link"`
  pinpoint the expandable row and the profile badge links in tests;
  don't strip them.
- Click handlers on `<CopyButton>` and profile `<Link>`s inside the
  row use `stopPropagation` so they don't toggle the row.
- SonarQube: this session did not run sonar for metahub-ui — the
  `metahub-ui` project is not present on the reachable SonarQube
  instances. Tests + build are the only gate.

## Known Issues

- Collection leaf URLs use graph IDs (`/collection/773/tag/772`) —
  these break when the graph is re-imported
- Profile filter dropdown shows duplicate `cpu` entries
- Profile filter selection has no effect on collection listing
- No profile detail page exists (only a card grid)
- Manifest cards don't show which profile they're served under

## 2026-10-23 — open-source-metahub

### What changed

- Removed storage IDs from the API types and routes: collections by
  `repo`+`tag`, ORAS by `repo`+`digest`, profiles by `label`/rule tuple,
  secrets by `name`.
- Public CI fast lane + aggregator.

### Key files

- `src/lib/api.ts`, `src/pages/Collections.tsx`, `src/pages/OrasArtifacts.tsx`
- OpenSpec: `openspec/changes/{add-public-ci,natural-key-identifiers}/`

### Gotchas

- The old `/collection/<id>/tag/<id>` URLs are gone; use `repo`+`tag`.
- `UserSecret.id` no longer exists; delete by `name`.
