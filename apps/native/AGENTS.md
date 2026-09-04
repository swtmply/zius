# Native design standard

Before changing UI, read `app/(tabs)/home.tsx` and the relevant components in `components/dashboard/`. The home dashboard is the design reference for all native screens, forms, sheets, and loading states. Reuse its components and styles when the same pattern applies.

## Text and sizes

Use HeroUI `Typography` for display text and the existing theme colors.

| Element | Standard |
| --- | --- |
| Page title | `text-2xl font-semibold` |
| Primary text and section labels | `text-sm` |
| Subtext, dates, and supporting copy | `text-xs text-muted` |
| Prominent balance or amount | `text-2xl font-semibold` |
| Currency in rows and inputs | `font-semibold`, preserving the surrounding text size |
| Participant avatar | `Avatar size="sm"` |
| Dashboard profile avatar | `Avatar size="md"` |
| Navigation and action icons | 24px |
| Small inline or dismiss icons | 16px |

Every currency amount, including its symbol and editable amount fields, must be semibold. Keep descriptive labels separate from the amount's styling.

## Spacing and alignment

- Use `gap-1` for related text, `gap-2` between section headers and content and inside transaction cards, and `gap-4` between major sections. Inline style equivalents are 4, 8, and 16.
- Keep overlapping participant avatars on transaction and group cards: center the row, leave the first avatar in place, and apply `-ml-4` to subsequent avatars. Match this overlap in loading placeholders.
- Match list separator and loading spacing to the corresponding loaded content.
- Center horizontal items with `flex-row items-center`. Keep text and controls vertically centered within the row.
- Match dashboard card padding, borders, and rounding. Keep safe-area insets and touch-target dimensions independent of content gaps.
- Apply shared control defaults in `global.css` when the rule belongs to every instance of that control.

## Toasts

For success and failure feedback, render `components/bill-creation-toast.tsx` through `toast.show({ component: ... })`, including group operations. This component is the shared create-transaction toast design. Use `variant="success"` for green feedback and `variant="danger"` for red feedback, with an operation-specific title and description.

## Loading and unfinished features

- Use HeroUI `Skeleton` for screen loading, matching the loaded layout's text, avatar, button sizes, spacing, and alignment. Use `components/transactions/transaction-details-loading.tsx` as the detail-screen reference. Do not substitute an `ActivityIndicator` for screen content.
- Wait for all data needed to label and display an amount correctly. Pending data must not appear as a zero balance. Provide retry feedback for query failures and keep back navigation available during loading.
- For unimplemented pages such as scan and notifications, reuse `components/feature-in-development.tsx`. Its header is exactly "The developer is working on this feature", followed by explanatory subtext and a Back button that falls back to home when there is no navigation history.

## Completion check

Review each changed screen's loaded, loading, and empty or error states against the dashboard and these rules. Check currency weights, text hierarchy, avatar and icon sizes, gaps, and horizontal alignment. Run the relevant existing checks and report whether visual verification was performed on a device or emulator.
