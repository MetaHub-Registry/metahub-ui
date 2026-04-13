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

## Known Issues

- Collection leaf URLs use graph IDs (`/collection/773/tag/772`) —
  these break when the graph is re-imported
- Profile filter dropdown shows duplicate `cpu` entries
- Profile filter selection has no effect on collection listing
- No profile detail page exists (only a card grid)
- Manifest cards don't show which profile they're served under
