---
name: orchestrate
description: Coordinate implementation and resume interrupted tasks only when the user explicitly invokes $orchestrate or asks for orchestration.
---

# Orchestrated implementation

Use this skill only when the user explicitly invokes `$orchestrate` or asks for orchestration. The Main Agent is whichever agent the user invoked orchestration with. It owns planning, delegation, escalation, and completion for both native and non-native changes. Follow repository workflow requirements and user overrides. Don't make useless updates. Let the sub-agents handle their assigned tasks independently and report back only relevant findings and changes.

## Checkpoints and resume

Before the first dispatch, follow the [checkpoint and resume protocol](references/checkpoint-resume.md) to create a durable task checkpoint. Update it before each dispatch and after each result, material plan change, or repair. Include its path in role handoffs. Long-running roles save progress at bounded work boundaries to their assigned report paths so an abrupt limit does not depend on a final chat response.

Write-enabled sub-agents commit each validated, self-contained work point before starting the next one, following the commit checkpoint rules in that protocol. Plan small commit boundaries rather than accumulating one final commit. Read-only stages record evidence without creating empty commits. A checkpoint commit preserves progress; it does not imply final acceptance or review PASS.

When the user resumes an interrupted task, or execution continues after a limit, session change, or context loss, read that protocol and reconcile the checkpoint with the current workspace before dispatching work. Continue from the first incomplete or invalidated step. Reuse completed work only while its evidence remains valid; all review and verification gates still apply.

## Dispatch

Use Luna with MAX thinking for primary roles. Never use the orchestrator's model for a sub-agent. Read only the role needed for the current stage, not the whole role catalog. Each receiver reads its linked role file and applicable repository instructions. Resolve Markdown links relative to their containing file.

Use `fork_turns: "none"` where supported. Each initial handoff contains:

- Goal, user constraints, and acceptance checks.
- Role-file path, workspace, read/write ownership, and relevant diff baseline, including pre-existing changes.
- The plan for write work; relevant paths, symbols, reuse candidates, findings, and unresolved questions for that role.
- For writers, planned commit points, staging ownership, and the checkpoint protocol path. Require the receiver to read its commit rules and return each commit SHA with scope and validation evidence.

Send excerpts needed for the decision and paths to larger artifacts. Avoid cumulative reports and raw logs. Reuse agents for same-role follow-ups with only the changed evidence, scope, and checks. Keep the Reviewer independent of agents that wrote the implementation or repairs.

Parallelize independent work only. Give writers disjoint file ownership, including shared configuration and lockfiles. Serialize staging and commits in a shared worktree through the Main Agent; disjoint files still share Git's index. Wait for prerequisite evidence before dispatching dependent work.

## Workflow

Use the native branch for changes to the native app or shared code that affects its behavior, including mixed native and server/web tasks. The Main Agent owns native planning and the final summary. Other tasks use the non-native branch.

### Recon and implementation

1. Recon Luna uses the [Scanner](../../../.codex/agents/scanner.md) role to inspect relevant code, architecture, patterns, and reuse candidates. Stop when affected boundaries, conventions, reuse, and validation entry points are identified or explicitly unknown. [Researcher](../../../.codex/agents/researcher.md) Luna resolves outside facts only when needed, such as docs, APIs, library compatibility, or known issues. Pass narrow questions and installed versions; skip when repository evidence suffices.
2. The orchestrator plans from that evidence. Define the approach and its reason, likely affected files, and acceptance criteria. Resolve unknowns that could invalidate the plan before assigning writes. For native work, the Main Agent also defines device verification steps with preconditions, navigation, inputs, expected UI/functional state, and relevant log/network checks. For code changes, draft an ADR as described below and include its path in handoffs.
3. [Implementer](../../../.codex/agents/implementer.md) Luna applies the bounded plan with minimal changes, runs relevant typecheck/lint/existing tests, and reports exactly which files and behavior changed plus check results. Follow user constraints on test creation.

### Native changes

For reported native bugs, dispatch [device-test](../../../.codex/agents/device-test.md) during reconnaissance to reproduce the issue and capture the actual device state before implementation when possible. Carry blocked or inconclusive reproduction into the plan as a limit, not a confirmed diagnosis.

4. Dispatch **device-test**, Luna with MAX thinking, as the device Verifier using Argent. Pass the latest diff, implementation/check results, acceptance criteria, and device verification steps. This role launches or reloads the app identified by `apps/native/app.json`, navigates the feature, executes acceptance scenarios, and inspects UI plus relevant logs/network. Require `PASS`, `FAIL`, or `BLOCKED` with evidence tied to each criterion. Static checks or the generic Verifier cannot replace this gate.

   On `FAIL`, send obvious implementation defects with their evidence to Implementer Luna. Send unclear or complex failures to [Debugger](../../../.codex/agents/debugger.md) Luna for root-cause diagnosis and a proposed or implemented fix. The repair owner reruns affected static checks, then device-test reruns the failed path and affected acceptance scenarios on the latest app state. Repeat until PASS or escalation is required. For missing setup or access, resolve the blocker or escalate; `BLOCKED` never counts as PASS.

5. After device-test passes, [Reviewer](../../../.codex/agents/reviewer.md) Luna independently reviews the latest task diff, ADR, and verification evidence. Check code correctness, YAGNI, regression risk, reuse, and coverage of every acceptance criterion. Route blocking findings to the appropriate repair owner. Behavior-changing repairs must pass device-test again before final re-review; reuse unaffected evidence only when still valid.

The Main Agent finalizes the ADR and sends the final summary using the [report contract](references/report-format.md) only after the current implementation passes device verification and final review. Include any remaining limits.

Device-test owns device interaction and runtime evidence throughout the native task, including reproduction requested by the Debugger or Reviewer. Keep device access exclusive; parallel agents may inspect code but must not mutate the same device session. The orchestrator tracks device/process ownership and arranges the role's scoped cleanup when verification and repair loops end.

### Non-native changes

4. [Reviewer](../../../.codex/agents/reviewer.md) independently reviews the task diff, requirements, and reuse decisions.
5. [Debugger](../../../.codex/agents/debugger.md) handles blocking findings or failed checks. Send reproduction evidence and the affected diff. Re-review behavior-changing repairs and rerun affected checks.
6. [Verifier](../../../.codex/agents/verifier.md), or the orchestrator directly, checks acceptance behavior. Route failures through repair and verification again.
7. Finalize the ADR against the delivered code and verification evidence, then report the outcome using the [report contract](references/report-format.md).

## Decision records

For each task that changes code, the orchestrator creates an ADR in repository-root `docs/adr`. Follow the existing numbered filename convention, using the next available `NNNN-short-decision-title.md`. Create the directory if absent. Update the same task's draft through implementation and repair; use a new linked ADR when superseding an earlier completed decision.

Keep the record concise: context, chosen approach and reason, material alternatives considered, affected code paths, consequences and tradeoffs, and verification results or limits. Mark proposed decisions as proposed until implemented. Record the final decision and behavior, with links to code and supporting evidence, rather than copying agent reports. The Reviewer checks the ADR against the implementation; the orchestrator keeps it current after repairs.

## Escalation

When Luna is blocked or cannot reach a defensible conclusion, use Terra with MAX thinking through [terra-readonly](../../../.codex/agents/terra-readonly.md) or [terra-writer](../../../.codex/agents/terra-writer.md), matching the original access. Pass the original role/task, evidence, attempts, exact failure, and unresolved questions. Retry with new evidence or a different strategy. A repeated blocker triggers escalation, not another identical attempt.

If Terra remains blocked, stop the affected lane and ask the user for the missing information or decision, with verified facts and attempts. Never convert unknowns into facts to continue.

## Context and completion

Use the task checkpoint as the working record of decisions, file ownership, evidence paths, completed checks, and open blockers. Re-read or repeat checks only when changes, contradictions, failures, or missing evidence justify it. Preserve large failure logs in referenced artifacts rather than copying them into the checkpoint. Keep role reports limited to evidence and progress needed for handoffs or recovery.

Complete when the requested behavior is delivered, required checks pass, practical runtime verification is complete, no Critical or Major finding remains, and code changes have a finalized ADR. Native completion also requires device-test PASS followed by final Reviewer PASS for the current implementation. Mark the checkpoint COMPLETE only after these gates pass, with links to the final evidence and ADR where applicable. Disclose unverified behavior and other limits. Saving tokens never waives a completion gate. Load the report contract when reporting; role-specific evidence requirements live in the role files.
