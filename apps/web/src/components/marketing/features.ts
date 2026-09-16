export const mobileFeatures = [
  {
    title: "Scan the receipt",
    description:
      "Point the camera at the bill or pick a photo. Zius reads the text on-device and you tap the total to drop it straight into an expense.",
    tag: "Mobile only",
  },
  {
    title: "Recognized on your phone, not a server",
    description:
      "Receipt text recognition runs locally. The picture of your dinner never leaves your device.",
    tag: "Mobile only",
  },
  {
    title: "Built for one thumb",
    description:
      "Native sheets, gesture navigation, and big touch targets. Splitting takes a few taps while you are still standing at the counter.",
    tag: "Mobile only",
  },
] as const;

export const sharedFeatures = [
  {
    title: "Four ways to split",
    description:
      "Equal, by percentage, fixed amounts, or per item when only two people got the wine.",
  },
  {
    title: "Centavo-exact math",
    description:
      "Remainders are distributed, never rounded away. Every split adds back up to the total.",
  },
  {
    title: "Groups that last",
    description:
      "Keep a house, a barkada, or a trip together with running balances for each circle.",
  },
  {
    title: "Guests, no account needed",
    description: "Add someone who has not signed up yet. They still get counted in every balance.",
  },
  {
    title: "Cancel without losing history",
    description:
      "A cancelled expense stays on the record as history instead of vanishing from the math.",
  },
  {
    title: "One account, both apps",
    description: "Everything you add on your phone is already there when you open the web app.",
  },
] as const;

export const webFeatures = [
  {
    title: "The whole history on one screen",
    description:
      "Months of dinners, rent, and trips laid out without scrolling a thumb raw. Filter by group, person, or state.",
  },
  {
    title: "Keyboard-speed entry",
    description:
      "Catching up on a backlog of expenses is faster with a real keyboard and a mouse than with a phone.",
  },
  {
    title: "Nothing to install",
    description:
      "Open a browser, sign in, and you are in the same ledger your group has been adding to all week.",
  },
] as const;

export const comparison = [
  { feature: "Receipt scanning with on-device text recognition", mobile: true, web: false },
  { feature: "Camera and photo library capture", mobile: true, web: false },
  { feature: "Create expenses, groups, and participants", mobile: true, web: true },
  { feature: "Equal, percentage, fixed, and per-item splits", mobile: true, web: true },
  { feature: "Filter and review the full expense history", mobile: true, web: true },
  { feature: "Wide screen for long group histories", mobile: false, web: true },
  { feature: "Keyboard-speed entry on a laptop", mobile: false, web: true },
] as const;

/** Mobile app screenshots, in the order a first split actually happens. */
export const mobileScreens = [
  {
    src: "mobile-dashboard",
    title: "Dashboard",
    caption: "What you owe and what you are owed, up top.",
  },
  {
    src: "receipt-camera",
    title: "Scan the receipt",
    caption: "Point the camera at the bill, or pick a photo.",
  },
  {
    src: "receipt-preview",
    title: "Tap the total",
    caption: "Text is recognized on-device. Tap the line you want.",
  },
  {
    src: "create-expense-item-split",
    title: "Split per item",
    caption: "Assign each line to whoever ordered it.",
  },
  {
    src: "create-expense-exact-split",
    title: "Split by exact amounts",
    caption: "Type fixed shares when the split is not even.",
  },
  {
    src: "create-expense-percentage-split",
    title: "Split by percentage",
    caption: "Or hand out percentages instead.",
  },
  {
    src: "expense-details-item-split",
    title: "Expense details",
    caption: "Who paid, who owes, and what they ordered.",
  },
  {
    src: "expense-details-actions",
    title: "Edit or archive",
    caption: "Cancelled expenses stay in the history.",
  },
  {
    src: "create-group",
    title: "Create a group",
    caption: "Name it, add people, reuse it every time.",
  },
  {
    src: "group-details-participants",
    title: "Group details",
    caption: "Participants and the group's running expenses.",
  },
  {
    src: "group-details-expenses",
    title: "Settled and unsettled",
    caption: "Each group keeps its own two piles.",
  },
  { src: "groups-list", title: "Your groups", caption: "House, barkada, trip. All in one list." },
  {
    src: "expense-history",
    title: "History",
    caption: "Every expense you have been part of, filterable.",
  },
] as const;
