# collections-breadcrumb-navigation Specification

## Purpose
Breadcrumb navigation across collection, repo, and tag levels in the web UI.

## Requirements

### Requirement: Breadcrumb links navigate to the correct collections URL
The `Breadcrumbs` component SHALL render each inactive breadcrumb as a `<Link>` whose `to` prop resolves to `/collections/<repo-path>`, where `<repo-path>` is taken directly from the `link` field of the `BreadCrumb` API response object (a bare repo path with no `/collections/` prefix).

#### Scenario: Inactive breadcrumb link for a single-segment repo
- **WHEN** the API returns a breadcrumb with `link: "qnib"` and `active: 1`
- **THEN** the rendered anchor's `href` SHALL be `/collections/qnib`

#### Scenario: Inactive breadcrumb link for a multi-segment repo
- **WHEN** the API returns a breadcrumb with `link: "qnib/featuretest"` and `active: 1`
- **THEN** the rendered anchor's `href` SHALL be `/collections/qnib/featuretest`

#### Scenario: Inactive breadcrumb link includes profile query param
- **WHEN** the `Breadcrumbs` component receives `profile="zen3"` and a breadcrumb with `link: "qnib"`
- **THEN** the rendered anchor's `href` SHALL be `/collections/qnib?profile=zen3`

#### Scenario: Active breadcrumb is not a link
- **WHEN** the API returns a breadcrumb with `active: 0`
- **THEN** the component SHALL render the crumb label as a plain `<span>`, not an `<a>` element

### Requirement: Collections page drives breadcrumb state from URL path
The `Collections` page SHALL derive its `repoPrefix` from the current URL path (everything after `/collections/`) and pass it to the `POST /api/v1/collections` request body so that navigating directly to `/collections/qnib/featuretest` renders the same state as clicking through breadcrumbs.

#### Scenario: Direct URL navigation to a nested repo
- **WHEN** a user navigates directly to `/collections/qnib/featuretest`
- **THEN** the page SHALL call `POST /api/v1/collections` with `{"repo": "qnib/featuretest"}`
- **THEN** the breadcrumbs SHALL reflect `Home / qnib / featuretest`

#### Scenario: Root collections URL shows root listing
- **WHEN** a user navigates to `/collections` (no trailing path)
- **THEN** the page SHALL call `POST /api/v1/collections` with `{"repo": ""}`
- **THEN** no breadcrumbs SHALL be rendered
