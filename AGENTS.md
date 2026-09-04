## Agent skills

### Issue tracker

Issues and specs are tracked in GitHub Issues using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five default triage labels. See `docs/agents/triage-labels.md`.

### Domain docs

Use the multi-context layout rooted at `CONTEXT-MAP.md`. See `docs/agents/domain.md`.

## Package versions

Before changing code that uses a dependency, identify the version used by the relevant workspace from its package manifest and lockfile. Implement against that version's API, types, and version-matched official documentation. When adding or upgrading a dependency, verify the target version and read its official migration guidance before editing dependent code.

## Native application

When creating or changing native screens, components, or styles, read `apps/native/AGENTS.md` for the dashboard design standard.
