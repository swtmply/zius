import { test } from "node:test";
import assert from "node:assert/strict";
import { FormApi } from "@tanstack/react-form";
import {
  clearInvalidItemAssignments,
  createExpenseItem,
  createExpenseSchema,
  expenseFormValidators,
  recalculateParticipants,
  type ExpenseFormValues,
  type FormParticipant,
} from "./expense-form-model";

test("expense splits preserve cents and removed participants lose item assignments", () => {
  const participants: FormParticipant[] = ["Alice", "Bob", "Carol"].map((name) => ({
    id: name,
    name,
    email: `${name.toLowerCase()}@example.com`,
    owedMinor: 0,
    splitValue: 0,
    isSplitValueEdited: false,
    status: "unpaid",
  }));
  assert.deepEqual(
    recalculateParticipants(participants, 100, "equal").map((person) => person.owedMinor),
    [34, 33, 33],
  );
  for (const method of ["fixed", "percentage"] as const) {
    const edited = participants.map((person, index) => ({
      ...person,
      splitValue: index === 0 ? 50 : 0,
      isSplitValueEdited: index === 0,
    }));
    assert.deepEqual(
      recalculateParticipants(edited, 100, method).map((person) => person.owedMinor),
      [50, 25, 25],
    );
  }

  const items = [
    createExpenseItem({
      name: "Lunch",
      quantity: 2,
      priceMinor: 100,
      participantEmail: "ALICE@example.com",
    }),
  ];
  assert.deepEqual(
    recalculateParticipants(participants, 100, "items", items).map((person) => person.owedMinor),
    [100, 0, 0],
  );
  const expense = {
    title: "Lunch",
    totalMinor: 100,
    splitMethod: "items",
    payer: participants[0]!.email,
    participants,
    items,
    occurredAt: 0,
  };
  assert.equal(createExpenseSchema.safeParse(expense).success, true);
  assert.equal(createExpenseSchema.safeParse({ ...expense, totalMinor: 101 }).success, false);
  const remaining = participants.slice(1);
  const unassigned = clearInvalidItemAssignments(items, remaining);
  assert.equal(unassigned[0]!.participantEmail, undefined);
  assert.equal(
    createExpenseSchema.safeParse({ ...expense, participants: remaining, items: unassigned })
      .success,
    false,
  );
});

test("expense validation recovers when fields are completed after an incomplete blur", async () => {
  const participant: FormParticipant = {
    id: "allen",
    name: "Allen",
    email: "allen@example.com",
    owedMinor: 0,
    splitValue: 0,
    isSplitValueEdited: false,
    status: "unpaid",
  };
  const defaultValues: ExpenseFormValues = {
    totalMinor: 0,
    title: "",
    splitMethod: "items",
    payer: participant.email,
    participants: [participant],
    items: [createExpenseItem({ name: "", quantity: 1, priceMinor: 0 })],
    occurredAt: 0,
    currency: "PHP",
  };
  let submitCount = 0;
  const form = new FormApi({
    defaultValues,
    validators: expenseFormValidators,
    onSubmit: () => {
      submitCount += 1;
    },
  });

  form.validate("blur");
  form.setFieldValue("items", [
    createExpenseItem({
      name: "Lunch",
      quantity: 1,
      priceMinor: 100,
      participantEmail: participant.email,
    }),
  ]);
  form.setFieldValue("totalMinor", 100);
  form.setFieldValue("title", "Lunch");

  assert.equal(form.state.canSubmit, true);
  assert.equal(form.state.isValid, true);
  await form.handleSubmit();
  assert.equal(submitCount, 1);
});
