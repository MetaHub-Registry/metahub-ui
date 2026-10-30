# Design — public CI for metahub-ui

## Stack and boundary

TypeScript/Vite.

Fast checks:

- `npm ci --ignore-scripts`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm audit --omit=dev --audit-level=high`
- `gitleaks` with the committed `.gitleaks.toml`
- DCO trailer check
- `license-checker` allowlist and generated `THIRD_PARTY_NOTICES.md`
- outbound-host allowlist

Container-backed checks: There are no container-backed tests.

The `shadcn` CLI moved to `devDependencies` (it is not imported at runtime), so the production audit reflects what actually ships. Three ESLint rules with a pre-existing baseline stay at warning level.

## Decisions

### Self-contained, fork-safe workflows

The workflows live in this repository. A cross-repository reusable workflow
would need either a public `.github` repository before the launch gate or
private access that a fork does not receive. Every PR-triggered workflow is
therefore self-contained, declares `permissions: contents: read`, pins
third-party actions by SHA and references no secret.

### One aggregator

`fast` depends on every fast job and fails when any of them fails or is
cancelled. Marking only `fast` as a required check at the visibility flip keeps
the branch-protection configuration stable as checks are added.

### No release-only lane

The UI tests are container-free, so the fast lane runs the whole suite on every
pull request. There is no `integration.yml` and no check is deferred to a
release tag.

### Dependencies and licences

The licence check fails on a dependency outside the allowlist and the notices
file is regenerated in CI; a drift fails the job. `npm audit --omit=dev
--audit-level=high` is blocking for the production graph and returned
0 vulnerabilities on 2026-10-30. `shadcn` is a dev dependency, so it is outside
the production audit.

### Outbound hosts

Non-test source may reference only hosts on `.github/outbound-allowlist.txt`.
A new host fails the job and must be added deliberately in review. This is a
review gate, not a network sandbox.

## Risks

| Risk | Mitigation |
|---|---|
| A workflow needs a secret when run from a fork | it belongs in the integration lane or is dropped |
| Action supply chain | every action is pinned to a full commit SHA |
| Dependency advisories | Dependabot opens weekly npm PRs; `npm audit --omit=dev` is the blocking production check |
