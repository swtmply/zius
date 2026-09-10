# Checkpoint and resume protocol

Use this protocol at task start, handoffs, interruption, and resume. The Main Agent owns the checkpoint. Role agents own only their assigned reports and write scope. Chat history, session memory, and agent handles are optional aids, not prerequisites for recovery.

## Durable record

Create `docs/orchestration/<task-id>/checkpoint.md` before the first dispatch. Choose a unique task ID using a timestamp and short task name; retain that ID across resumes. Keep supporting reports and evidence in the same task directory when they need persistence. Resolve recorded paths relative to the repository root. Keep one current checkpoint per task rather than a transcript or a new copy per session.

Record enough to continue in a fresh session without rereading the full conversation. Use this structure, omitting fields that do not apply:

```markdown
# <task-id>

Updated: <UTC timestamp>
Status: ACTIVE | PAUSED | BLOCKED | COMPLETE
Workspace: <repository/worktree path>
Baseline: <branch and starting HEAD, or non-Git equivalent>
Workflow: native | non-native | mixed
Current stage: <stage and attempt>
Resume: $orchestrate resume docs/orchestration/<task-id>/checkpoint.md

## Goal and constraints

<User request, scope, explicit constraints, and later user decisions.>

## Plan and acceptance

<Chosen approach, affected paths, acceptance criteria, and device steps.>
ADR: <path and proposed/final status, for code changes>

## Progress and ownership

<Each stage: PENDING, RUNNING, PASS, FAIL, BLOCKED, or SKIPPED with reason.>
<Assigned role, owned files, report path, active agent handle if available.>
<Task changes versus pre-existing user changes, including untracked files.>
<Partial edits, last completed action, in-flight action, and uncertain outcomes.>

## Commit checkpoints

<Planned work point, owner, validation, and PENDING, COMMITTED, or BLOCKED.>
<For each commit: full SHA, parent SHA, subject, owned paths, and report path.>
<Current staging owner, in-flight commit intent, and remaining uncommitted work.>

## Evidence

<Check/scenario, outcome, evidence path, and the code/runtime state checked.>
<Record commit plus relevant tracked diff and untracked-file fingerprints for dirty work.>
<Failures, reproduction steps, review findings, and verification limits.>

## Runtime and blockers

<Device/app/build identity, last observed screen and test data state.>
<Processes, ports, ownership, cleanup done or pending, and restart requirements.>
<Missing prerequisites, unresolved questions, and escalation attempts.>

## Next action

<One concrete next step, assigned role, prerequisites, and expected result.>
```

Link existing ADRs and evidence instead of copying their full content. Preserve failures and unresolved questions when shortening the record. Store only the inputs needed to reproduce a scenario; redact secrets and personal data. Record secure setup requirements, never credential values.

## Checkpoint timing

1. At task start, record the goal, constraints, initial workspace baseline, pre-existing changes, and first action. Give the user the checkpoint path and its resume command once, without requiring a response.
2. Before dispatch, record the role, stage as RUNNING, file ownership, assigned report path, expected result, and relevant code baseline. Include the checkpoint and report paths in the handoff. Each role saves a concise report after a validated edit batch, completed investigation, or acceptance scenario, before starting the next batch. Reports identify partial work and unchecked edits; writers never update the shared checkpoint.
3. After a result, the Main Agent merges its status, changed files, commit SHAs, evidence, remaining issues, and next action into the checkpoint before advancing. Update the same record when the plan changes, a check fails, or a repair invalidates evidence. A stage passes only on supporting evidence, never merely because its agent exited or created a commit.
4. On a requested pause or a known approaching limit, stop new dispatches. Save available results and partial state; mark PAUSED, or BLOCKED for an unresolved prerequisite. Record outstanding agents/actions and process/device ownership. When ending a device session, perform the scoped cleanup required by the device-test role and record what must restart. Report only the checkpoint link, interruption status, and resume command.

Limits can stop execution without warning. These pre-dispatch checkpoints and incremental role reports are the recovery mechanism; a final pause message is not guaranteed. If a checkpoint write fails, report the failure and its recovery limits before starting further work.

## Commit rules

These orchestration rules authorize local checkpoint commits by write-enabled roles, including Implementer, Debugger, and escalation writers, unless the user explicitly opts out. Each point is a small, coherent change with its required focused checks complete, not each tool call or an entire multi-step assignment. Include necessary companion changes so the commit does not depend on another role's uncommitted work. Read-only roles save reports without committing application code or making empty commits.

1. The Main Agent defines commit points in the write plan and grants one staging/commit owner at a time per shared worktree. Writers may edit disjoint files in parallel, but must receive that grant before touching the index. Do not create branches or worktrees solely to avoid coordination without user approval.
2. At a work point, inspect the diff and run its focused checks before committing. If a required check fails or cannot run, preserve the partial work and report a BLOCKED commit point with the failure or verification limit; repair it or obtain an explicit user exception. Do not create a knowingly broken checkpoint merely because a limit is approaching. Native acceptance and final review can remain pending after an implementation commit; record that distinction.
3. Before staging, inspect HEAD, the working tree, and the index against the handoff baseline. Stage only owned task changes using explicit paths or isolated task hunks. Never use repository-wide staging such as `git add .`, `git add -A`, or `git commit -a`. Pre-existing changes in an owned file still belong to the user. If the index contains another owner's work, or mixed changes cannot be isolated confidently, leave them untouched and return the staging blocker to the Main Agent. Do not unstage, stash, or discard someone else's work to make room.
4. Inspect the staged diff for exact scope, secrets, and accidental artifacts. Confirm it contains the self-contained change that was checked, not unrelated staged or unstaged work. Include assigned documentation or sanitized reports when they belong to that point; exclude raw logs, device captures, and private runtime data by default. Only the Main Agent edits the shared checkpoint. Do not create a recursive commit just to record a commit's own SHA.
5. Save commit intent in the assigned role report before running the commit: parent HEAD, intended subject, owned paths, and check outcomes. Create a local commit with a concise subject describing that single change, following repository conventions. Keep hooks and signing requirements enabled. On failure, report the exact blocker; do not alter Git identity, signing, hooks, or credentials to bypass it. After success, inspect the resulting commit and remaining status, record the full SHA and parent in the role report, and release staging ownership before the next point.
6. The Main Agent records each SHA and its evidence in the checkpoint. Keep the original task baseline and an ordered list of task commits, plus any remaining uncommitted task diff. Pass that complete scope to the Reviewer; reviewing only the latest commit or unstaged changes misses earlier points. Exclude unrelated commits and user changes from the review scope.

Keep repair commits separate so earlier checkpoints remain available. Do not amend, squash, rebase, reset, or push checkpoint history unless the user requests it. A saved SHA is a recovery reference, not permission to roll the user's worktree back. Do not claim completion with unexplained uncommitted deliverable changes; record and resolve blocked commit points or an explicit user exception. Checkpoint metadata and runtime evidence may remain local, with that persistence limit disclosed.

## Resume procedure

1. Use the checkpoint path supplied by the user. For a request to resume without a path, inspect incomplete checkpoints under `docs/orchestration/`; continue the sole matching task, or ask the user to choose if multiple tasks match. If no checkpoint exists, reconstruct from available reports, workspace evidence, and user context. Mark unknowns explicitly and ask only for information needed to proceed safely.
2. Read the checkpoint, applicable instructions, and the reports or evidence for the current stage. The agent the user invoked now becomes the Main Agent. Apply newer user instructions and record any resulting plan change. A COMPLETE checkpoint needs no redispatch unless new scope or invalidated evidence requires reopening it.
3. Compare the actual repository/worktree, branch, HEAD, task diff, and untracked files with the recorded baseline and evidence fingerprints. Verify recorded commit SHAs still exist and inspect their relationship to the current branch. For an interrupted commit with no recorded SHA, inspect the role's saved intent, recent history, commit contents, and index to determine whether it already succeeded before attempting another commit. Reconcile staging ownership before any index operation; stale grants are not permission to stage. Inspect partial edits and changes made since the last checkpoint. Preserve user work; do not reset, checkout, stash, commit, or recreate a branch to force the old state. Resolve ambiguous ownership or incompatible changes before resuming writes.
4. Reconcile agents, commands, and external actions recorded as RUNNING. Reuse a live same-role agent only when its identity and ownership are confirmed. If it is gone, dispatch a replacement with the saved plan, partial diff, report, and next action. Never create overlapping writers. Inspect current state before repeating an action whose outcome is unknown, especially a data mutation, install, or device gesture. Mark missing outcomes as unverified, not successful.
5. Check evidence freshness. Reuse results only when the relevant code, dependencies, configuration, and runtime prerequisites still match. Rerun missing, failed, interrupted, or invalidated checks and downstream gates, not the whole workflow by default. Keep the Reviewer independent of writers across sessions.
6. For native work, return device control to device-test. It follows Argent setup, lists available devices, confirms the configured app identity and build/bundle freshness, and observes the current UI and relevant service/test-data state. Restore only authorized scenario preconditions. Recorded device handles, screens, and Metro sessions may be stale; never assume they survived. Reuse prior device evidence only if its conditions are still valid, otherwise rerun affected acceptance checks before final review.
7. Update the reconciled checkpoint to ACTIVE with the first incomplete or invalidated step and its owner. Briefly state where work resumes and any changed assumptions, then continue without repeating completed reconnaissance or requesting approval for unchanged authorized scope. Keep it BLOCKED when a prerequisite or user decision is still missing.

At completion, retain the checkpoint marked COMPLETE with final evidence and cleanup status. Resume preserves the workflow's completion gates; it does not turn interrupted checks into PASS or bypass verification to save time.
