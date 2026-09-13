# Receipt items expense split

Status: Proposed.

## Context

Receipt scanning currently opens a separate details page. The requested flow keeps the image preview, then opens Create Expense with editable receipt items and the detected total. Each item has one assigned participant, as shown in the supplied design.

## Decision

Add an Items split method alongside the existing methods. Store quantity, name, line price in minor currency units, order, and assigned participant for each expense item in a new table. The server derives participant amounts from assigned line prices and saves items and participant amounts in the expense transaction. It validates assignments and requires the item sum to match the expense total, so missing assignments or receipt discrepancies cannot silently change balances.

Keep the existing amount input, participant management, group flow, and receipt parser. Route submitted previews to Create Expense and remove the superseded scan details route. Detected receipt totals prefill the amount field and remain outside the item rows. When no total is recognized, prefill the editable amount with the sum of parsed line prices. This is an item sum, not a detected receipt total.

Use a HeroUI Native Select bottom sheet for each row's assignment button. Provide editable quantity, name, line price, removal, and Add item. Quantity describes the receipt row; its price is already a line total and is not multiplied again. Removing a participant clears their item assignments for correction. Changing split methods preserves the draft rows but submits them only for Items.

## Alternatives

- Reuse Fixed splits: rejected because saved participant amounts alone cannot recover item descriptions or assignments.
- Split one item across multiple participants: deferred because the supplied design assigns one participant per row.
- Automatically distribute a difference between the item sum and receipt total: rejected because it would invent an allocation the user has not chosen.

## Affected code

To be finalized after implementation: native scan and create-expense routes, expense form and item editor, receipt parsing boundary, database expense schema and migration, and expense API create/get contracts.

## Verification

Backend implementation is complete; native integration and independent review are pending.

Backend API and database type checks, targeted lint and formatting passed. Isolated create/get verification confirmed ordered item storage and canonical participant IDs. Additional in-memory API calls confirmed that forged client participant amounts are ignored, a participant with no assigned items owes zero, quantity does not multiply the line price, invalid items and mismatched totals return BAD_REQUEST, and an unrelated participant cannot retrieve the expense. The existing API suite reported five passing scenarios and one archived-group payment failure; baseline verification is pending.

Receipt parsing with two Burger units at 200.00, Tea at 50.00, and TOTAL 250.00 returned two item rows and totalMinor 25000. Native device verification is pending. A connected Android device and Expo server were available before the usage-limit interruption. No test files will be added under repository instructions. Existing unrelated scan setup, dependencies, and root app configuration are preserved. The pre-task working diff is recorded at `/tmp/zius-item-split-baseline/preexisting.patch` for this session.
