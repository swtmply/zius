# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root. It points to the relevant context-specific `CONTEXT.md` files.
- **`docs/adr/`** for system-wide architectural decisions.
- **`apps/<context>/docs/adr/`** and **`packages/<context>/docs/adr/`** for context-specific decisions.

Read only the contexts and ADRs relevant to the work.

If any of these files don't exist, **proceed silently**. Don't flag their absence or suggest creating them upfront. The `/domain-modeling` skill creates them lazily when terms or decisions are resolved.

## File structure

```text
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                         ← system-wide decisions
├── apps/
│   └── <context>/
│       ├── CONTEXT.md
│       └── docs/
│           └── adr/                 ← app-specific decisions
└── packages/
    └── <context>/
        ├── CONTEXT.md
        └── docs/
            └── adr/                 ← package-specific decisions
```

## Use the glossary's vocabulary

When output names a domain concept—in an issue title, refactor proposal, hypothesis, or test name—use the term defined in the relevant `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If a needed concept isn't in the glossary, either reconsider whether the project uses that language or note the gap for `/domain-modeling`.

## Flag ADR conflicts

If output contradicts an existing ADR, surface it explicitly rather than silently overriding it:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
