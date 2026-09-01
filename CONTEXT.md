# Shared Expenses

Zius tracks shared spending between people, whether or not every person has registered an account or belongs to a persistent group.

## Language

**Person**:
An identity that can belong to groups and participate in expenses, with or without a registered account.
_Avoid_: User, account holder

**Guest**:
A person who is not yet linked to a registered account.
_Avoid_: Guest user, placeholder user

**Expense Group**:
A persistent named collection of people who share expenses.
_Avoid_: Account, room

**Membership**:
A person's time-bounded association with an expense group as its owner or a member.
_Avoid_: Friendship, connection

**Expense**:
A record of money paid and owed by one or more participants, optionally within an expense group.
_Avoid_: Transaction, bill

**Participant**:
A person assigned a paid amount, an owed amount, or both on an expense.
_Avoid_: Payer, debtor

**Cancellation**:
The invalidation of an expense while retaining it as financial history.
_Avoid_: Deletion
