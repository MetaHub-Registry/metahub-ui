# Tasks — natural-key identifiers (metahub-ui)

- [x] 1.1 `src/lib/api.ts`: remove `collection_id` / `tag_id` from
      `CollectionNext`; remove `id` from `OrasArtifact`, `ApiProfile`,
      `ApiProfileRule`, `ProfileDetailResponse` and `ApiManipulation`.
- [x] 1.2 Remove `id` from `UserSecret`; address secrets by `name`.
- [x] 2.1 `src/pages/Collections.tsx`: pass `repo` / `tag` through the click
      handler and the detail request.
- [x] 2.2 `src/pages/OrasArtifacts.tsx`: address the artifact by `repo` +
      `digest`.
- [x] 2.3 Profile pages: key rules and manipulations by their natural keys.
- [x] 2.4 Secrets page: delete by `name`.
- [x] 3.1 Update the tests and fixtures that asserted the removed fields.
- [x] 3.2 Build and test suite green.
