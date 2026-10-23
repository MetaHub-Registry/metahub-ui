## ADDED Requirements

### Requirement: The UI sends natural keys

The UI SHALL address resources by their natural keys in request bodies and
routes: `repo` + `tag` for collections, `repo` + `digest` for ORAS artifacts,
`label` for profiles, `name` for secrets and `username` for the user. A
storage ID SHALL NOT be required to perform any UI action.

#### Scenario: Collection selection

- **WHEN** a user selects a collection
- **THEN** the client sends `repo_name` and `tag_name`
- **AND** the TypeScript type has no `collection_id` or `tag_id` field

#### Scenario: ORAS artifact

- **WHEN** a user opens an ORAS artifact
- **THEN** the client addresses it by `repo` and `digest`

#### Scenario: Secret deletion

- **WHEN** a user deletes a secret
- **THEN** the client sends the secret `name`
- **AND** no numeric ID is sent

### Requirement: Types and routes carry no storage IDs

The UI SHALL NOT declare numeric storage IDs for the affected resources, and
its routes SHALL NOT contain one.

#### Scenario: Profile detail

- **WHEN** a profile is rendered
- **THEN** its rules and manipulations are keyed by the rule tuple and
  `label`
- **AND** no `id` field is read from the response

#### Scenario: Collection route

- **WHEN** a collection is opened
- **THEN** the route is based on `repo` and `tag`
- **AND** it does not contain a graph element ID
