# Group status filter in the filter sheet

Status: Accepted

## Context

The groups page renders status controls outside the existing filter sheet. The user requested moving the picker into `GroupFilters`.

## Decision

Move the status options and picker into `GroupFilters`, alongside Type and Sort. Pass the normalized status from the page, reset a draft status when opening the sheet, and apply all three draft values on Submit. Keep route normalization and the group query in the page.

Using the existing draft-and-submit interaction keeps the controls consistent. Applying status immediately from inside the sheet would make it behave differently from its neighboring controls. No shared filter abstraction is needed.

## Affected code

- [Groups page](../../apps/native/app/%28modals%29/groups/index.tsx) passes the current status and removes the inline picker.
- [GroupFilters](../../apps/native/components/groups/group-filters.tsx) owns the status options, draft state, and picker.

## Consequences

Active remains the default. Archived and All retain their query meaning. Status changes now take effect on Submit; dismissing the sheet discards unapplied changes when it is reopened.

## Verification

Native `bun run check-types`, targeted `bunx oxlint`, targeted `bunx oxfmt --check`, and `git diff --check` passed. Source inspection confirms that opening resets status from the current route-derived prop and Submit commits all three filters together. Query normalization, loading, empty, and error rendering remain unchanged.

No device or emulator was connected according to `adb devices`, so visual verification and native interaction checks were not performed.
