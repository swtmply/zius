# Report contract

Use for role handoffs and final reports. Include only applicable fields; combine related evidence instead of repeating it under several headings.

## Role handoff

State status, bounded scope, and the result needed by the next role.

- Evidence: paths and symbols, source links, or command/scenario results supporting conclusions. Separate verified facts from assumptions and unknowns.
- Decisions or findings: explain material choices or issues once, with evidence and effect. Include the assigned role's required details.
- Changes: identify every file changed by this task, with its purpose. Group files sharing a reason.
- Checks: command or scenario, outcome, and what it proves. Include expected versus actual behavior for failures or when success would otherwise be ambiguous.
- Limits and next action: blockers, unchecked behavior, deviations, or a required decision. Omit when none apply.

Use `PASS`, `CHANGES REQUIRED`, `FAIL`, or `BLOCKED` as appropriate. A role's PASS applies only to its stated scope.

For follow-ups, report the delta and remaining issues. Link existing evidence rather than copying earlier reports. Keep blockers, reproduction details, and contradictory evidence even when shortening output.

## Final response

Lead with the delivered result and completion status. Summarize meaningful changes, review and verification results, and unresolved limits. Include reuse decisions or skipped stages only when they explain the result or a limitation. Use `COMPLETE` only when the skill's completion gates pass.

For code changes, link the finalized ADR in `docs/adr` as the durable reference for decisions and affected code. Summarize its outcome instead of repeating its contents.

Account for each task-changed file once, grouped where useful. For large changes, link a complete file inventory and summarize by component. Keep process transcripts and repeated requirement-to-result chains out of the response. Report word or token counts only when requested; label estimates and name the comparison baseline.
