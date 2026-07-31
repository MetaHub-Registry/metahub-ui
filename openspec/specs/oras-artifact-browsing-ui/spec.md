# oras-artifact-browsing-ui Specification

## Purpose
Web UI for browsing ORAS artifacts — listings, detail, and layers.

## Requirements

### Requirement: ORAS artifacts browse page
The application SHALL provide an `OrasArtifacts` page at routes `/oras` and `/oras/*` that navigates the ORAS artifact repo tree, mirroring the structure of the `Collections` page.

#### Scenario: Root ORAS listing
- **WHEN** a user navigates to `/oras`
- **THEN** the page SHALL call `GET /api/v1/oras` (with no repo param or empty repo)
- **THEN** the page SHALL render the top-level repo path segments as clickable cards

#### Scenario: Drill into a repo prefix
- **WHEN** a user navigates to `/oras/qnib`
- **THEN** the page SHALL call `GET /api/v1/oras?repo=qnib`
- **THEN** the page SHALL render the next-level path segments under `qnib/` as cards

#### Scenario: Leaf repo shows artifact types
- **WHEN** the API returns a `next` map keyed by `artifactType` values (slug_end = 1)
- **THEN** each card SHALL display the artifact type as its title
- **THEN** clicking a card SHALL navigate to `/oras/artifact?repo=<repo>&type=<artifactType>`

#### Scenario: Breadcrumbs reflect ORAS navigation path
- **WHEN** the page is at `/oras/qnib/featuretest`
- **THEN** breadcrumbs SHALL show `Home / qnib / featuretest`
- **THEN** clicking `qnib` SHALL navigate to `/oras/qnib`

#### Scenario: Filter input narrows visible cards
- **WHEN** a user types into the filter input on the ORAS artifacts page
- **THEN** only cards whose key contains the filter string (case-insensitive) SHALL be visible

### Requirement: ORAS artifact detail page
The application SHALL provide an `OrasArtifactDetail` page at route `/oras/artifact` that displays the full metadata of a single ORAS artifact identified by `?repo=` and `?type=` query parameters.

#### Scenario: Artifact detail renders metadata
- **WHEN** a user navigates to `/oras/artifact?repo=qnib/featuretest&type=application/vnd.cyclonedx`
- **THEN** the page SHALL call `GET /api/v1/oras/artifact?repo=qnib/featuretest&artifact_type=application/vnd.cyclonedx`
- **THEN** the page SHALL display the artifact's digest, media type, artifact type, and annotations

#### Scenario: Artifact blobs are listed
- **WHEN** the artifact has one or more blobs
- **THEN** each blob SHALL be rendered with its digest (truncated), media type, and size

#### Scenario: Subject reference is shown when present
- **WHEN** the artifact has a non-null `subject` field
- **THEN** the page SHALL display the subject's digest and media type

#### Scenario: Missing query params shows error
- **WHEN** a user navigates to `/oras/artifact` without `repo` or `type` query params
- **THEN** the page SHALL render an error message indicating the required parameters are missing

### Requirement: ORAS navigation is accessible from the main layout
The application layout SHALL include a navigation link to `/oras` alongside the existing Collections link so users can discover the ORAS browser.

#### Scenario: Nav link to ORAS browser is visible
- **WHEN** a user views any page with the main layout
- **THEN** a navigation link labelled "Artifacts" (or "ORAS") pointing to `/oras` SHALL be visible in the nav bar
