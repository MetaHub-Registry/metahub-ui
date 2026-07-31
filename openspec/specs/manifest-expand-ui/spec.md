# manifest-expand-ui Specification

## Purpose
TBD - created by archiving change collection-manifest-expand. Update Purpose after archive.
## Requirements
### Requirement: Collection detail rows expand inline to show manifest internals
Each manifest row in the collection detail page SHALL be collapsible,
collapsed by default, and expand inline to reveal the image's config
descriptor, annotations, and layer descriptors when the user toggles
the row.

#### Scenario: User expands a row
- **WHEN** the user clicks the row header of a manifest whose API payload
  carries `config` and `layers`
- **THEN** the row SHALL reveal a "Config" section with one
  digest/media_type/size entry and a "Layers" section listing each
  layer's digest/media_type/size

#### Scenario: Manifest has no annotations
- **WHEN** the manifest payload has an empty or missing `annotations`
  object
- **THEN** the expanded view SHALL NOT render the Annotations section

#### Scenario: Manifest has no config
- **WHEN** the `config` field is absent from the payload
- **THEN** the expanded view SHALL NOT render the Config section

### Requirement: Profile badges link to the profile detail page
Each profile label shown on a manifest row SHALL render as a link that
navigates to `/profiles/<url-encoded-label>` on click without toggling
the surrounding row's expansion state.

#### Scenario: Click profile badge
- **WHEN** the user clicks a profile badge whose label is `cpu#zen3`
- **THEN** the router SHALL navigate to `/profiles/cpu%23zen3` and the
  row's expanded/collapsed state SHALL NOT change

### Requirement: Upstream is visible on the row when present
When a manifest carries an `upstream` string, the row SHALL display that
string beside the digest line, followed by a copy-to-clipboard button.

#### Scenario: Upstream present
- **WHEN** `manifest.upstream` is `quay.io/org/repo:tag`
- **THEN** the row SHALL render the string and a copy button that puts
  `quay.io/org/repo:tag` into the clipboard when clicked

#### Scenario: Upstream absent
- **WHEN** `manifest.upstream` is empty or missing
- **THEN** the row SHALL NOT render an upstream label or copy button

