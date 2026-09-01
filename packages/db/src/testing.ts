import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

export async function createTestDb() {
  const client = createClient({ url: ":memory:" });
  const db = drizzle({ client, schema });

  await client.batch(
    [
      `create table user (
        id text primary key,
        name text not null,
        email text not null unique,
        email_verified integer not null default false,
        image text,
        deleted_at integer,
        created_at integer not null,
        updated_at integer not null
      )`,
      `create table person (
        id text primary key,
        user_id text references user(id) on delete restrict,
        display_name text not null,
        email_normalized text not null,
        created_by_user_id text references user(id) on delete set null,
        claimed_at integer,
        created_at integer not null default (cast(unixepoch('subsecond') * 1000 as integer)),
        updated_at integer not null default (cast(unixepoch('subsecond') * 1000 as integer)),
        constraint person_email_normalized_check
          check (email_normalized = lower(trim(email_normalized))),
        constraint person_claim_state_check check (
          (user_id is null and claimed_at is null)
          or (user_id is not null and claimed_at is not null)
        )
      )`,
      "create unique index person_user_id_uidx on person(user_id)",
      "create unique index person_email_normalized_uidx on person(email_normalized)",
      `create table expense_group (
        id text primary key,
        name text not null,
        image text,
        default_currency text not null default 'PHP',
        created_by_id text not null references user(id) on delete restrict,
        archived_at integer,
        created_at integer not null default (cast(unixepoch('subsecond') * 1000 as integer)),
        updated_at integer not null default (cast(unixepoch('subsecond') * 1000 as integer)),
        constraint expense_group_currency_check check (length(default_currency) = 3)
      )`,
      `create table expense_group_member (
        group_id text not null references expense_group(id) on delete cascade,
        person_id text not null references person(id) on delete restrict,
        role text not null default 'member',
        joined_at integer not null default (cast(unixepoch('subsecond') * 1000 as integer)),
        removed_at integer,
        primary key (group_id, person_id),
        constraint expense_group_member_role_check check (role in ('owner', 'member'))
      )`,
      "create index expense_group_member_person_id_idx on expense_group_member(person_id, removed_at)",
    ],
    "write",
  );

  return {
    db,
    close: () => client.close(),
  };
}
