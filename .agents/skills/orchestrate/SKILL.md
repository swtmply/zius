---
name: orchestrate
description: Coordinate evidence-driven implementation, debugging, architecture, and multi-file coding through specialized agents.
---

# Orchestrated implementation

The main agent owns planning, delegation, escalation, and completion. Follow repository workflow requirements and user overrides.

## Dispatch

Use Luna with MAX thinking for primary roles. Never use the orchestrator's model for a sub-agent. Read only the role needed for the current stage, not the whole role catalog. Each receiver reads its linked role file and applicable repository instructions. Resolve Markdown links relative to their containing file.

Use `fork_turns: "none"` where supported. Each initial handoff contains:

- Goal, user constraints, and acceptance checks.
- Role-file path, workspace, read/write ownership, and relevant diff baseline, including pre-existing changes.
- The plan for write work; relevant paths, symbols, reuse candidates, findings, and unresolved questions for that role.

Send excerpts needed for the decision and paths to larger artifacts. Avoid cumulative reports and raw logs. Reuse agents for same-role follow-ups with only the changed evidence, scope, and checks. Keep the Reviewer independent of agents that wrote the implementation or repairs.

Parallelize independent work only. Give writers disjoint file ownership, including shared configuration and lockfiles. Wait for prerequisite evidence before dispatching dependent work.

## Workflow

1. [Scanner](../../../.codex/agents/scanner.md) gathers repository evidence and reuse candidates. Stop reconnaissance when affected boundaries, conventions, candidate reuse, and validation entry points are identified or explicitly unknown.
2. [Researcher](../../../.codex/agents/researcher.md) resolves outside facts that affect the plan, such as API behavior or version compatibility. Skip when repository evidence suffices. Pass narrow questions and installed versions.
3. Plan from that evidence. State meaningful choices with their reason and expected effect. Resolve unknowns that could invalidate the plan before assigning writes. For code changes, the orchestrator drafts an ADR as described below and includes its path in handoffs.
4. [Implementer](../../../.codex/agents/implementer.md) applies the bounded plan and runs relevant checks.
5. [Reviewer](../../../.codex/agents/reviewer.md) independently reviews the task diff, requirements, and reuse decisions.
6. [Debugger](../../../.codex/agents/debugger.md) handles blocking findings or failed checks. Send reproduction evidence and the affected diff. Re-review behavior-changing repairs and rerun affected checks.
7. [Verifier](../../../.codex/agents/verifier.md), or the orchestrator directly, checks acceptance behavior. Route failures through repair and verification again.
8. Finalize the ADR against the delivered code and verification evidence, then report the outcome using the [report contract](references/report-format.md).

## Decision records

For each task that changes code, the orchestrator creates an ADR in repository-root `docs/adr`. Follow the existing numbered filename convention, using the next available `NNNN-short-decision-title.md`. Create the directory if absent. Update the same task's draft through implementation and repair; use a new linked ADR when superseding an earlier completed decision.

Keep the record concise: context, chosen approach and reason, material alternatives considered, affected code paths, consequences and tradeoffs, and verification results or limits. Mark proposed decisions as proposed until implemented. Record the final decision and behavior, with links to code and supporting evidence, rather than copying agent reports. The Reviewer checks the ADR against the implementation; the orchestrator keeps it current after repairs.

## Escalation

When Luna is blocked or cannot reach a defensible conclusion, use Terra with MAX thinking through [terra-readonly](../../../.codex/agents/terra-readonly.md) or [terra-writer](../../../.codex/agents/terra-writer.md), matching the original access. Pass the original role/task, evidence, attempts, exact failure, and unresolved questions. Retry with new evidence or a different strategy. A repeated blocker triggers escalation, not another identical attempt.

If Terra remains blocked, stop the affected lane and ask the user for the missing information or decision, with verified facts and attempts. Never convert unknowns into facts to continue.

## Context and completion

Retain a compact working record of decisions, file ownership, evidence paths, completed checks, and open blockers. Re-read or repeat checks only when changes, contradictions, failures, or missing evidence justify it. Preserve failure details in an artifact when logs are large; pass the path and relevant excerpt. Create persistent handoff artifacts only when context size or recovery warrants them.

Complete when the requested behavior is delivered, required checks pass, practical runtime verification is complete, no Critical or Major finding remains, and code changes have a finalized ADR. Disclose unverified behavior and other limits. Saving tokens never waives a completion gate. Load the report contract when reporting; role-specific evidence requirements live in the role files.
