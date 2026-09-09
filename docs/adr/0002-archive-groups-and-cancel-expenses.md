# Archive groups and cancel expenses

Status: Accepted

## Context

[Issue #21](https://github.com/swtmply/zius/issues/21) requires finished groups to leave everyday lists without erasing debts, and mistaken expenses to stop counting without erasing payment history.

## Decision

Reuse `group.archivedAt` for reversible, owner-only archival. Group lists default to active, with archived and all filters. A shared guard refuses renaming and expense creation in archived groups. Reads, payment updates, and cancellation remain available. This checkout has no procedure for changing an existing group's membership. Any future membership write must apply the same guard; adding that separate feature is outside this change.

Add a terminal `cancelled` expense status with `cancelledAt` and `cancelledByUserId`. Only the recorder or group owner may cancel an active expense. Settlement and cancellation metadata must agree with status through database constraints. Cancellation preserves participant payment rows and refuses later payment updates.

Keep archived debts in dashboard balances. Exclude archived groups from activity lists and explicitly exclude cancelled expenses from recent activity, whose existing query does not filter by active status. Preserve settled expenses in recent activity for active groups.

Expose state and cancellation metadata in API responses. Expense detail reports cancellation permission and the cancelling person's identity. The recorder and group owner must be able to open the detail even when they are not listed in the expense split. Native screens provide archive and restore actions, an active/archived group filter, cancellation confirmation with the number of paid participants, and visible frozen or cancelled states. Reuse existing HeroUI controls, shared feedback, and query invalidation patterns.

Reuse the router caller, fixtures, and in-memory libSQL helpers from the prerequisite change. Those helpers landed with #20 but were removed in #38. Restore the helpers needed for the router tests explicitly requested by #21.

## Alternatives and consequences

A shared soft-delete mechanism would conflate reversible group organization with terminal financial cancellation. Freezing payment updates in archived groups would strand outstanding debts. Both are rejected by the requested behavior.

Use a new table-rebuild migration to change SQLite constraints while preserving existing rows and migration history. Do not reset any configured database. Cancellation does not refund money that already moved, and settled expenses cannot be cancelled.

## Affected code

- Database state and constraints: [expense schema](../../packages/db/src/schema/expense.ts), [upgrade migration](../../packages/db/src/migrations/0001_blue_tombstone.sql), [schema snapshot](../../packages/db/src/migrations/meta/0001_snapshot.json), and [migration journal](../../packages/db/src/migrations/meta/_journal.json).
- API rules and responses: [group router](../../packages/api/src/routers/group.ts), [expense router](../../packages/api/src/routers/expense.ts), [dashboard router](../../packages/api/src/routers/dashboard.ts), and [shared archive guard](../../packages/api/src/routers/helpers.ts).
- Router verification: [acceptance suite](../../packages/api/test/issue-21.test.ts), [caller helper](../../packages/api/test/support/caller.ts), [database helper](../../packages/api/test/support/database.ts), and [fixtures](../../packages/api/test/support/fixtures.ts).
- Group interface: [list](../../apps/native/app/(modals)/groups/index.tsx), [detail](../../apps/native/app/(modals)/groups/[groupId].tsx), and [expense cards](../../apps/native/components/groups/group-details.tsx).
- Expense interface: [list](../../apps/native/app/(modals)/expenses/index.tsx), [detail](../../apps/native/app/(modals)/expenses/[expenseId].tsx), and [dashboard expense types](../../apps/native/lib/mock-data.ts).

## Verification

The clean baseline passed `bun run check-types`. Baseline `bun test` reported no tests found because #38 removed the earlier suite.

The seeded upgrade check in `tmp/verify-issue-21-migration.ts` passed through the actual Drizzle migrator. Existing active and settled expenses survived, paid participant rows remained identical, and `PRAGMA foreign_key_check` returned no violations. The script uses a temporary in-memory database, never a configured database.

The integrated `bun run check-types` passed across API, native, server, web, and shared UI. The HTTP smoke in `tmp/verify-issue-21-http.ts` passed OpenAPI generation and archive, group filtering, frozen rename refusal, cancellation, audit detail, cancellation/payment conflicts, and restoration through the request handler.

`bun test packages/api` passed six tests and 79 assertions. The suite covers mixed-state lists, both sides of dashboard balances, permission and state refusals, restoration, archived payment updates and cancellation, and preserved paid records. API and database type checks, backend lint and formatting, and `git diff --check` also passed.

Native type, lint, and formatting checks passed. `bunx expo export --platform android --max-workers 1 --output-dir .expo/issue-21-final-export-android` produced a Hermes bundle and metadata for 27 assets. The output remains ignored by Git.

Independent review passed with no Critical or Major findings. The reviewer independently reran the router suite, workspace type checks, and diff checks. No Android device or emulator was connected when checked with `adb devices -l`; native visual verification remains unavailable.
