# Expense is the only name for the concept

The glossary called it an Expense, the database and the tRPC router called it a bill, and the mobile app called it a transaction — in routes, component directories, form models, and the field the group detail procedure returned. Agents reading the glossary and then the code were given contradictory instructions about which word to use.

We adopted **Expense** as the name in the product's own vocabulary: tables, indexes, constraints, the tRPC router and its procedures, the generated REST paths, and the mobile screens and components. The join table between an expense and the people on it is named for expense participants. "Transaction" now survives only where it means a database transaction, or in a third-party symbol we don't control.

## Scope

The web application's marketing and legal copy is deliberately untouched. It describes the product to people who have never met the glossary, and "split the bill" is the phrase they arrive with.

## Consequences

Renaming the procedure paths and the REST paths is a breaking change. There are no external API consumers, and already-installed mobile builds recover over the air through the configured EAS update channels, so no backwards-compatible aliases were kept.

The production database held no real data, so the two existing migrations were squashed into a single regenerated initial migration rather than a hand-written rename being added. No table under the old name appears anywhere in migration history, and any database that had already run the old migrations must be dropped and re-created.
