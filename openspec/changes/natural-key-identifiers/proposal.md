## Why

The UI's TypeScript types and routes carry numeric storage IDs
(`collection_id`, `tag_id`, profile/rule/manipulation `id`, ORAS artifact
`id`, secret `id`). They break when the graph is re-imported, and the API no
longer emits them. Collection leaf URLs like `/collection/773/tag/772` are the
most visible symptom.

## What Changes

- `src/lib/api.ts` drops the storage-ID fields from `CollectionNext`,
  `OrasArtifact`, `ApiProfile`, `ApiProfileRule`, `ProfileDetailResponse` and
  `ApiManipulation`.
- Collections, ORAS and profile pages address resources by `repo` + `tag`,
  `repo` + `digest`, and `label` / the rule tuple.
- Secrets are addressed by `name` and the user by `username`; the secret delete
  call uses the name.
- Tests and fixtures stop asserting the removed fields.

## Impact

- Breaking change for the UI's typed API client; no external consumers.
- The routes no longer expose a storage ID, so bookmarks based on `/collection/<id>`
  are not preserved (pre-1.0, private).
