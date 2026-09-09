# Agent Workflow

Use the `$orchestrate` skill only when the user explicitly invokes it or asks for orchestration. Otherwise, handle the task directly.

The following workflow and model policy apply only when the user requests orchestration. The main agent then acts as the **Orchestrator and Planner**.

The orchestrator may be Astra, Sol, Opus, or Fable.

## Sub-Agent Model Policy

- Never use the same model as the active orchestrator.
- Primary sub-agents use **Luna with MAX thinking**.
- If Luna becomes blocked or cannot reach a defensible conclusion, escalate to **Terra with MAX thinking**.
- If Terra also cannot proceed confidently, stop and ask the user for verification, missing information, or a recommendation.
- Never guess merely to continue the workflow.

## Required Workflow

For explicitly requested orchestration:

**Scanner → Researcher when needed → Orchestrator Plan → Implementer → Reviewer → Debugger when needed → Verifier → Final Report**

The orchestrator owns planning, delegation, escalation, context handoff, final completion decisions, and the final report.

Follow this workflow when orchestration is explicitly requested.

User instructions take precedence over this workflow.
