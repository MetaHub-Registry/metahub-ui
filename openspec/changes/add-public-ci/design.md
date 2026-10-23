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

### Container-backed checks gate releases

Tests that need Docker run in `integration.yml` on release tags and
`workflow_dispatch`, with no secrets. They never run on a pull request.

### Dependencies and licences

The licence check fails on a dependency outside the allowlist and the notices
file is regenerated in CI; a drift fails the job. `npm audit --omit=dev` is
blocking for the production graph. `govulncheck` is advisory until the current
transitive baseline (containerd, docker, regclient, OpenTelemetry) is refreshed;
the job still runs on every pull request.

### Outbound hosts

Non-test source may reference only hosts on `.github/outbound-allowlist.txt`.
A new host fails the job and must be added deliberately in review. This is a
review gate, not a network sandbox.

## Risks

| Risk | Mitigation |
|---|---|
| A workflow needs a secret when run from a fork | it belongs in the integration lane or is dropped |
| Action supply chain | every action is pinned to a full commit SHA |
| Dependency advisories | Dependabot opens weekly PRs; the Go vulnerability job is advisory until the current baseline is cleared |
