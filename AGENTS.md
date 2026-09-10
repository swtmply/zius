# Agent Workflow

Use the `$orchestrate` skill only when the user explicitly invokes it or asks for orchestration. Otherwise, handle the task directly.

The following workflow and model policy apply only when the user requests orchestration. The Main Agent then acts as the **Orchestrator and Planner**.

The **Main Agent** is whichever agent the user invoked orchestration with. It remains the orchestrator for both native and non-native changes.

## Sub-Agent Model Policy

- Never use the same model as the active orchestrator.
- Primary sub-agents use **Luna with MAX thinking**.
- If Luna becomes blocked or cannot reach a defensible conclusion, escalate to **Terra with MAX thinking**.
- If Terra also cannot proceed confidently, stop and ask the user for verification, missing information, or a recommendation.
- Never guess merely to continue the workflow.

## Required Workflow

For explicitly requested orchestration, follow the [orchestrate skill](.agents/skills/orchestrate/SKILL.md).

For native changes, including shared code that affects native behavior:

**Recon + Research when needed -> Main Agent Plan -> Implementer -> device-test with Argent -> Final Reviewer -> Main Agent Final Report**

The [device-test role](.codex/agents/device-test.md) owns actual-device acceptance checks and bug reproduction. Device verification must pass before final review. Route obvious implementation failures to the Implementer and unclear failures to the Debugger, then rerun device verification. Behavior-changing review repairs repeat device verification and final review.

For other changes:

**Scanner -> Researcher when needed -> Orchestrator Plan -> Implementer -> Reviewer -> Debugger when needed -> Verifier -> Final Report**

The orchestrator owns planning, delegation, escalation, context handoff, final completion decisions, and the final report.

Follow this workflow when orchestration is explicitly requested.

User instructions take precedence over this workflow.
