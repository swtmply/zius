export type ActiveTransaction = {
  id: string;
  title: string;
  totalMinor: number;
  currency: string;
  status: "active" | "settled";
  occurredAt: string;
  participants: {
    id: string;
    name: string;
    email: string;
  }[];
};

export type RecentTransaction = {
  id: string;
  title: string;
  totalMinor: number;
  currency: string;
  status: "active" | "settled";
  occurredAt: string;
};

export const activeTransactions = [
  {
    id: "txn_001",
    title: "Dinner at Manam",
    totalMinor: 150000,
    currency: "PHP",
    status: "active",
    occurredAt: "2026-09-01T19:30:00.000Z",
    participants: [
      {
        id: "participant_001",
        name: "Allen",
        email: "allen@example.com",
      },
      {
        id: "participant_002",
        name: "John",
        email: "john@example.com",
      },
      {
        id: "participant_003",
        name: "Maria",
        email: "maria@example.com",
      },
    ],
  },
  {
    id: "txn_002",
    title: "Grab Ride",
    totalMinor: 48500,
    currency: "PHP",
    status: "active",
    occurredAt: "2026-08-31T22:15:00.000Z",
    participants: [
      {
        id: "participant_001",
        name: "Allen",
        email: "allen@example.com",
      },
      {
        id: "participant_004",
        name: "Joshua",
        email: "joshua@example.com",
      },
    ],
  },
  {
    id: "txn_003",
    title: "Grocery Run",
    totalMinor: 324750,
    currency: "PHP",
    status: "active",
    occurredAt: "2026-08-29T14:20:00.000Z",
    participants: [
      {
        id: "participant_001",
        name: "Allen",
        email: "allen@example.com",
      },
      {
        id: "participant_002",
        name: "John",
        email: "john@example.com",
      },
      {
        id: "participant_003",
        name: "Maria",
        email: "maria@example.com",
      },
      {
        id: "participant_004",
        name: "Joshua",
        email: "joshua@example.com",
      },
    ],
  },
  {
    id: "txn_004",
    title: "Netflix Subscription",
    totalMinor: 61900,
    currency: "PHP",
    status: "settled",
    occurredAt: "2026-08-25T08:00:00.000Z",
    participants: [
      {
        id: "participant_001",
        name: "Allen",
        email: "allen@example.com",
      },
      {
        id: "participant_003",
        name: "Maria",
        email: "maria@example.com",
      },
    ],
  },
  {
    id: "txn_005",
    title: "Weekend Staycation",
    totalMinor: 875000,
    currency: "PHP",
    status: "active",
    occurredAt: "2026-08-22T15:00:00.000Z",
    participants: [
      {
        id: "participant_001",
        name: "Allen",
        email: "allen@example.com",
      },
      {
        id: "participant_002",
        name: "John",
        email: "john@example.com",
      },
      {
        id: "participant_003",
        name: "Maria",
        email: "maria@example.com",
      },
    ],
  },
] satisfies ActiveTransaction[];

export const recentTransactions = [
  {
    id: "txn_001",
    title: "Dinner at Manam",
    totalMinor: 150000,
    currency: "PHP",
    status: "active",
    occurredAt: "2026-09-01T19:30:00.000Z",
  },
  {
    id: "txn_002",
    title: "Grab Ride",
    totalMinor: 48500,
    currency: "PHP",
    status: "active",
    occurredAt: "2026-08-31T22:15:00.000Z",
  },
  {
    id: "txn_003",
    title: "Grocery Run",
    totalMinor: 324750,
    currency: "PHP",
    status: "active",
    occurredAt: "2026-08-29T14:20:00.000Z",
  },
  {
    id: "txn_004",
    title: "Netflix Subscription",
    totalMinor: 61900,
    currency: "PHP",
    status: "settled",
    occurredAt: "2026-08-25T08:00:00.000Z",
  },
  {
    id: "txn_005",
    title: "Weekend Staycation",
    totalMinor: 875000,
    currency: "PHP",
    status: "active",
    occurredAt: "2026-08-22T15:00:00.000Z",
  },
  {
    id: "txn_006",
    title: "Coffee Run",
    totalMinor: 56000,
    currency: "PHP",
    status: "settled",
    occurredAt: "2026-08-20T09:45:00.000Z",
  },
  {
    id: "txn_007",
    title: "Lunch at Mendokoro",
    totalMinor: 243500,
    currency: "PHP",
    status: "active",
    occurredAt: "2026-08-18T12:30:00.000Z",
  },
  {
    id: "txn_008",
    title: "Movie Tickets",
    totalMinor: 126000,
    currency: "PHP",
    status: "settled",
    occurredAt: "2026-08-16T18:00:00.000Z",
  },
  {
    id: "txn_009",
    title: "Electricity Bill",
    totalMinor: 428350,
    currency: "PHP",
    status: "active",
    occurredAt: "2026-08-12T10:00:00.000Z",
  },
  {
    id: "txn_010",
    title: "Pizza Night",
    totalMinor: 189900,
    currency: "PHP",
    status: "settled",
    occurredAt: "2026-08-10T20:15:00.000Z",
  },
] satisfies RecentTransaction[];
