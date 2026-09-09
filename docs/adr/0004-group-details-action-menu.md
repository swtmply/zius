# Group details action menu

Status: Implemented for Edit, Archive, and Restore. Delete pending clarification.

## Context

The group details header exposes rename while archive and restore use a separate full-width button. The user requested an actions menu for active groups and a restore icon for archived groups.

## Decision

Use the installed HeroUI Menu with left icons for Edit, Delete, and Archive. Reuse the existing rename and archive/restore handlers and owner permissions. Keep the save button while renaming. Remove the separate archive/restore button to put group management in the header.

While renaming, replace the header back arrow with XIcon to cancel editing and dismiss the keyboard. Remove the separate Cancel row so entering edit mode does not add a row to the layout. Cancellation remains disabled while saving, and the normal back action returns when editing ends.

Deletion has no existing API. The Delete row is visible with its left icon but disabled while its behavior awaits user clarification. No deletion endpoint or data removal behavior has been added.

## Affected code

- `apps/native/app/(modals)/groups/[groupId].tsx`

## Consequences

Archived groups expose RestoreBinIcon in the header. Active group actions share one menu. A custom menu or shared abstraction is unnecessary for this page.

## Verification

Native `bun run check-types`, targeted `bunx oxlint`, targeted `bunx oxfmt --check`, and `git diff --check` passed. Source inspection confirms owner-only actions, left icons, reuse of rename and archive/restore handlers, and the disabled Delete row. Independent review passed with no correctness findings. No tests were added, following repository instructions. `adb devices` found no connected device or emulator, so native visual and interaction verification is unavailable.
