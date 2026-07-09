# Agent Instructions

## Codebase Knowledge Graph

This repo ships a pre-built knowledge graph of its own source at
`.understand-anything/knowledge-graph.json` (nodes, edges, architectural layers,
and a guided tour). **Consult it before broad code exploration** — it is faster
and cheaper than blind file/grep search for "where does X live", "who calls X",
or "what depends on Y".

### How to use it

- **First stop for orientation.** Grep the graph for relevant `name`/`summary`/`tags`
  to find nodes, then follow `imports`/`calls`/`contains` edges for the 1-hop
  subgraph. Don't dump the whole file into context — search the sections you need.
- **Resolve symbols via the graph, not `grep`.** Node IDs are
  `function:<relpath>:<Name>` (hooks and components likewise, e.g.
  `function:src/contexts/AuthContext.tsx:useAuth`). Reserve `rg`/grep for
  string/literal search. Two usage patterns:
  - **Hooks / functions** are linked by `calls` edges (caller → callee), so "who
    calls `useAuth`?" is a direct query.
  - **Component rendering** (JSX) is captured at **file granularity** via
    `imports` edges — "what renders `<Layout>`?" is "which files import
    `Layout.tsx`?".

  ```bash
  KG=.understand-anything/knowledge-graph.json

  # Where is it defined?
  jq -r '.nodes[] | select(.id|endswith(":useAuth")) | .id' "$KG"

  # Who calls a hook/function? (the usages you'd otherwise grep for)
  jq -r '.edges[] | select(.type=="calls" and (.target|endswith(":useAuth"))) | .source' "$KG"

  # Who renders a component? (files importing it)
  jq -r '.edges[] | select(.type=="imports" and (.target|test("Layout"))) | .source' "$KG"
  ```
- **Scope.** The graph is scoped to code + key infra (see
  `.understand-anything/.understandignore`); OpenSpec docs and misc yaml are
  intentionally excluded.

### Keeping it fresh

The graph is tied to a git commit (`.understand-anything/meta.json`) with a
fingerprints baseline. After material code changes, regenerate it with the
global `/understand` tool (re-analyzes only changed files) and commit the updated
`.understand-anything/` artifacts alongside the code so the graph's commit hash
tracks `HEAD`. A stale-but-present graph is still a useful map; note staleness if
the commit hash differs from `HEAD`.
