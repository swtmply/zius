# Native design standard

Before changing UI, read `app/(tabs)/home.tsx` and the relevant components in `components/dashboard/`. The home dashboard is the design reference for all native screens, forms, sheets, and loading states. Reuse its components and styles when the same pattern applies.

## Text and sizes

Use HeroUI `Typography` for display text and the existing theme colors.

| Element                             | Standard                                              |
| ----------------------------------- | ----------------------------------------------------- |
| Page title                          | `text-2xl font-semibold`                              |
| Primary text and section labels     | `text-sm`                                             |
| Subtext, dates, and supporting copy | `text-xs text-muted`                                  |
| Prominent balance or amount         | `text-2xl font-semibold`                              |
| Currency in rows and inputs         | `font-semibold`, preserving the surrounding text size |
| Participant avatar                  | `Avatar size="sm"`                                    |
| Dashboard profile avatar            | `Avatar size="md"`                                    |
| Navigation and action icons         | 24px                                                  |
| Small inline or dismiss icons       | 16px                                                  |

Every currency amount, including its symbol and editable amount fields, must be semibold. Keep descriptive labels separate from the amount's styling.

## Spacing and alignment

- Use `gap-1` for related text, `gap-2` between section headers and content and inside expense cards, and `gap-4` between major sections. Inline style equivalents are 4, 8, and 16.
- Use `gap-1` on the parent row for participant avatars in expense and group cards. Match this spacing in loading placeholders.
- Match list separator and loading spacing to the corresponding loaded content.
- Center horizontal items with `flex-row items-center`. Keep text and controls vertically centered within the row.
- Match dashboard card padding, borders, and rounding. Keep safe-area insets and touch-target dimensions independent of content gaps.
- Apply shared control defaults in `global.css` when the rule belongs to every instance of that control.

## Toasts

For success and failure feedback, render `components/expense-creation-toast.tsx` through `toast.show({ component: ... })`, including group operations. This component is the shared create-expense toast design. Use `variant="success"` for green feedback and `variant="danger"` for red feedback, with an operation-specific title and description.

## Loading and unfinished features

- Use HeroUI `Skeleton` for screen loading, matching the loaded layout's text, avatar, button sizes, spacing, and alignment. Use `components/expenses/expense-details-loading.tsx` as the detail-screen reference. Do not substitute an `ActivityIndicator` for screen content.
- Wait for all data needed to label and display an amount correctly. Pending data must not appear as a zero balance. Provide retry feedback for query failures and keep back navigation available during loading.
- For unimplemented pages such as scan and notifications, reuse `components/feature-in-development.tsx`. Its header is exactly "The developer is working on this feature", followed by explanatory subtext and a Back button that falls back to home when there is no navigation history.

## Completion check

Review each changed screen's loaded, loading, and empty or error states against the dashboard and these rules. Check currency weights, text hierarchy, avatar and icon sizes, gaps, and horizontal alignment. Run the relevant existing checks and report whether visual verification was performed on a device or emulator.

## File Structure

I want to have a specific folder structure for the mobile app. I want you to basically follow this and ask me for clarification if you don't know where to put a file. These are the sample files that in the future I want you to follow. Adding features and pages should follow this structure.

```text
native/
├── app/
│   ├── _layout.tsx (Stack)
│   ├── index.tsx
│   ├── +not-found.tsx
│   └── (pages)/
│       ├── (main)/
│       │   ├── home.tsx
│       │   └── history.tsx
│       │   └── groups.tsx
│       │   └── scan.tsx
│       └── (modals)/
│           ├── expenses/
│           │   ├── index.tsx
│           │   └── create.tsx
│           │   └── [expenseId].tsx
│           └── groups/
│               ├── index.tsx
│               └── create.tsx
│               └── [groupId].tsx
├── components/
│   ├── expenses/
│   │   ├── expense-card.tsx
│   │   └── expense-*.tsx
│   │   └── expense-form/
│   │   │   ├── expense-form.tsx
│   │   │   └── expense-(*-component).tsx
│   │   └── skeletons/
│   │       └── expense-*-skeleton.tsx
│   ├── groups/
│   │   ├── group-card.tsx
│   │   └── group-*.tsx
│   │   └── group-form/
│   │   │   ├── group-form.tsx
│   │   │   └── group-(*-component).tsx
│   │   └── skeletons/
│   │       └── group-*-skeleton.tsx
│   └── layout/
│       ├── (application-components).tsx
│       └── skeletons/
│           └── *-skeleton.tsx
├── utils/
│   ├── expenses/
│   │   ├── expense-form.ts
│   │   └── expense.ts
│   ├── groups/
│   │   ├── group-form.ts
│   │   └── group.ts
│   ├── scan-utils.ts
│   └── *.ts
```

## Device Testing

Don't use frontier models for testing. Always use `gpt-5.6-luna` with `MAX` thinking when testing or any other cheaper model.

Use agent-device only for app/device automation tasks. For a normal app-driving task, start immediately. Do not probe first with `--help`, `--version`, `devices`, `appstate`, `snapshot`, or `screenshot`; open the requested app in the foreground and continue from its initial interactive snapshot. For TV, Fire TV, or Vega OS tasks, read `agent-device help tv`. For exploratory QA, read `agent-device help dogfood`. For logs, network, audio, traces, or runtime failures, read `agent-device help debugging`. For React Native component trees, props/state/hooks, slow renders, or rerenders, read `agent-device help react-devtools`. For React Native JavaScript heap growth, heap snapshots, allocation hotspots, or retained-object leaks, read `agent-device help cdp`. For React Native apps, overlays, Metro/Fast Refresh blockers, and routing to React DevTools or debugging evidence, read `agent-device help react-native`.

Use MCP tools or the CLI in the integrated terminal. If `agent-device` is not on PATH but the user installed it globally in another shell, resolve the command the same way the user would from a normal terminal session and run that absolute path instead. This may require inspecting shell startup behavior or package-manager/global bin locations; do not assume the agent process `PATH` is the user's `PATH`. Do not silently fall back to `npx -y agent-device@latest`; ask or use an exact version. MCP exposes structured tools backed by the agent-device client; it does not expose generic shell execution. Prefer `open -> snapshot -i -> act -> re-snapshot -> verify -> close` where the target supports capture and selectors; otherwise follow target-specific help. Use current refs such as `@e3` for exploration and selectors for durable replay. Keep mutating commands against one session serial. Capture screenshots, logs, network, audio, perf, traces, recordings, and `.ad` replay scripts only when they add evidence.

```
agent-device open <app-or-url> --platform <platform> --foreground
```
