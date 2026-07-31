# profile-detail-manipulations-ui Specification

## Purpose
TBD - created by archiving change profile-detail-manipulations. Update Purpose after archive.
## Requirements
### Requirement: Profile detail page shows linked manipulations
The profile detail route `/profiles/:label` SHALL render, below the
matching rules, a "Manipulations" section that lists every manipulation
returned on the API response's `manipulations` array.

#### Scenario: Profile with one extended manipulation
- **WHEN** the API returns a profile with `manipulations: [{ label: "layer/x#1", default: {...}, variants: [...] }]`
- **THEN** the UI SHALL render a Manipulations section with one card
  titled `layer/x#1` containing a default sub-section and a variants
  sub-section

#### Scenario: Profile with a legacy-form manipulation
- **WHEN** the API returns a manipulation whose `default` and `variants`
  are empty but `layers` is non-empty
- **THEN** the card SHALL render a single "Layers" sub-section listing
  each entry with its rule chip and image URL (when present)

#### Scenario: Empty manipulations
- **WHEN** the API returns `manipulations: []`
- **THEN** the UI SHALL render the Manipulations heading and a muted
  "No manipulations linked to this profile" message

### Requirement: Variants render their rule expression as a monospace chip
The UI SHALL render each variant's rule key (e.g. `arch:arm64=true`) as a
monospaced chip or badge so operators can recognise it as a runtime
selector.

#### Scenario: Variant keyed by a boolean expression
- **WHEN** a variant has rule key `arch:amd64=true && cpu:x86_64_v3=true`
- **THEN** the UI SHALL render the entire string inside a single chip,
  using a monospace font

### Requirement: Commands are shown as op + value pairs
CMD and ENTRYPOINT mutations on a manipulation config SHALL render as a
labelled block that surfaces the operation (`replace` / `prepend` /
`append`) and the string-slice value.

#### Scenario: Replace entrypoint
- **WHEN** a config has `entrypoint: { op: "replace", value: ["/bin/entry"] }`
- **THEN** the UI SHALL show an "Entrypoint" header, an op pill reading
  `replace`, and the value as a monospaced list / code fence

