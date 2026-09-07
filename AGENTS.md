# Agent Workflow

For non-trivial implementation, debugging, architecture, API, database, authentication, deployment, or multi-file coding tasks, use the `$orchestrate` skill.

The main agent acts as the **Orchestrator and Planner**.

The orchestrator may be Astra, Sol, Opus, or Fable.

## Sub-Agent Model Policy

- Never use the same model as the active orchestrator.
- Primary sub-agents use **Luna with MAX thinking**.
- If Luna becomes blocked or cannot reach a defensible conclusion, escalate to **Terra with MAX thinking**.
- If Terra also cannot proceed confidently, stop and ask the user for verification, missing information, or a recommendation.
- Never guess merely to continue the workflow.

## Required Workflow

For applicable tasks:

**Scanner → Researcher when needed → Orchestrator Plan → Implementer → Reviewer → Debugger when needed → Verifier → Final Report**

The orchestrator owns planning, delegation, escalation, context handoff, final completion decisions, and the final report.

Do not bypass the orchestration workflow when the task clearly matches it.

User instructions take precedence over this workflow.
