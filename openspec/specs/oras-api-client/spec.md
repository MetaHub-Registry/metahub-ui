## ADDED Requirements

### Requirement: fetchOrasArtifacts API function
The `src/lib/api.ts` module SHALL export a `fetchOrasArtifacts(repoPrefix: string)` function that calls `GET /api/v1/oras` with the given prefix as a query parameter and returns an `OrasListResponse`.

#### Scenario: fetchOrasArtifacts with a repo prefix
- **WHEN** `fetchOrasArtifacts("qnib")` is called
- **THEN** it SHALL send `GET /api/v1/oras?repo=qnib`
- **THEN** it SHALL return a typed `OrasListResponse`

#### Scenario: fetchOrasArtifacts with empty prefix
- **WHEN** `fetchOrasArtifacts("")` is called
- **THEN** it SHALL send `GET /api/v1/oras` (no repo query param, or `repo=`)
- **THEN** it SHALL return the root-level listing

### Requirement: fetchOrasArtifact API function
The `src/lib/api.ts` module SHALL export a `fetchOrasArtifact(repo: string, artifactType: string)` function that calls `GET /api/v1/oras/artifact` and returns an `OrasArtifactResponse`.

#### Scenario: fetchOrasArtifact with repo and type
- **WHEN** `fetchOrasArtifact("qnib/featuretest", "application/vnd.cyclonedx")` is called
- **THEN** it SHALL send `GET /api/v1/oras/artifact?repo=qnib%2Ffeaturetest&artifact_type=application%2Fvnd.cyclonedx`
- **THEN** it SHALL return a typed `OrasArtifactResponse`

### Requirement: ORAS TypeScript types
The `src/lib/api.ts` module SHALL export TypeScript interfaces for all ORAS API response shapes.

#### Scenario: OrasListing interface fields
- **WHEN** `OrasListing` is used in TypeScript
- **THEN** it SHALL have fields: `repo: string`, `artifact_type: string`, `artifact_count: number`

#### Scenario: OrasArtifact interface fields
- **WHEN** `OrasArtifact` is used in TypeScript
- **THEN** it SHALL have fields: `id: number`, `repo: string`, `digest: string`, `media_type: string`, `artifact_type: string`, `annotations: Record<string, string>`, `subject?: Manifest`, `blobs: Manifest[]`

#### Scenario: OrasListResponse interface fields
- **WHEN** `OrasListResponse` is used in TypeScript
- **THEN** it SHALL have fields: `next: Record<string, OrasListing>`, `bread_crumbs: BreadCrumb[]`, `slug_end: number`

#### Scenario: OrasArtifactResponse interface fields
- **WHEN** `OrasArtifactResponse` is used in TypeScript
- **THEN** it SHALL have fields: `artifact: OrasArtifact`, `bread_crumbs: BreadCrumb[]`
