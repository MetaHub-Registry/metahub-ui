# oras-artifact-browsing Specification

## Purpose
TBD - created by archiving change oras-artifact-detail-layers. Update Purpose after archive.
## Requirements
### Requirement: OrasBlob TypeScript interface

An `OrasBlob` interface SHALL be defined with fields: `digest: string`, `media_type: string`, `size: number`, `title: string`, `annotations: Record<string, string>`.

#### Scenario: OrasBlob fields are typed
- **WHEN** an `OrasBlob` value is received from the API
- **THEN** it exposes `digest`, `media_type`, `size`, `title`, and `annotations` with the specified types

### Requirement: Layer cards show file name when available

The ORAS artifact detail page SHALL display each layer as a card. When `blob.title` is non-empty, the card heading SHALL show the title (file name). When `blob.title` is empty, the card heading SHALL show `blob.media_type`.

#### Scenario: File artifact with title
- **WHEN** a blob has `title = "artifact.txt"`
- **THEN** the card SHALL display "artifact.txt" as the primary label with a file icon
- **AND** the mediaType SHALL appear as a secondary badge

#### Scenario: Typed artifact without title
- **WHEN** a blob has `title = ""` and `media_type = "application/vnd.cyclonedx+json"`
- **THEN** the card SHALL display the mediaType as the primary label

### Requirement: Layers section heading

The section heading SHALL read "Layers" instead of "Blobs" to align with OCI terminology.

#### Scenario: Heading reads Layers
- **WHEN** the ORAS artifact detail page renders the blob section
- **THEN** the section heading reads "Layers" (not "Blobs")

