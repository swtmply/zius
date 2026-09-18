"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zius/api/routers/index";
import { expenseCategories } from "@zius/api/expense-categories";
import { toast } from "sonner";

import { queryClient, trpc } from "@/utils/trpc";

import { toMinor } from "./expense-values";
import { refreshDashboard } from "./mutations";
import { Participants, type ParticipantDraft } from "./participants";
import { dashboardRoutes } from "./routes";
import { ScreenHeader } from "./screen-header";
import { Skeleton } from "./skeleton";
import { useUser } from "./user-context";

type Group = inferRouterOutputs<AppRouter>["group"]["get"];

export function ExpenseForm({ groupId }: { groupId: string }) {
  const initial = useQuery(trpc.group.get.queryOptions({ id: groupId }, { enabled: !!groupId }));

  if (groupId && initial.isPending) {
    return (
      <div className="space-y-4">
        <ScreenHeader backHref={dashboardRoutes.home} title="Create expense" />
        <div className="panel space-y-4" aria-label="Loading group" aria-busy>
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-11 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (groupId && initial.isError) {
    return (
      <div className="space-y-4">
        <ScreenHeader backHref={dashboardRoutes.home} title="Create expense" />
        <div className="flex flex-col items-center gap-4 py-8" role="alert">
          <p className="text-sm text-supporting">Unable to load this group.</p>
          <button
            type="button"
            className="action-secondary"
            onClick={() => {
              void initial.refetch();
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (initial.data?.archivedAt) {
    return (
      <div className="space-y-4">
        <ScreenHeader backHref={dashboardRoutes.home} title="Create expense" />
        <p className="panel text-sm text-supporting">
          Restore this group before adding an expense.
        </p>
      </div>
    );
  }

  return <ExpenseFormFields initialGroup={initial.data} />;
}

function ExpenseFormFields({ initialGroup }: { initialGroup?: Group }) {
  const user = useUser();
  const router = useRouter();
  const [participants, setParticipants] = useState<ParticipantDraft[]>(
    initialGroup
      ? initialGroup.participants.map((person) => ({
          name: person.name,
          email: person.email,
          share: "0",
          paid: false,
        }))
      : [{ name: user.name, email: user.email, share: "0", paid: false }],
  );
  const [group, setGroup] = useState(initialGroup?.id ?? "");
  const [isLoadingGroup, setIsLoadingGroup] = useState(false);
  const [payer, setPayer] = useState(
    initialGroup && !initialGroup.participants.some((person) => person.email === user.email)
      ? (initialGroup.participants[0]?.email ?? "")
      : user.email,
  );
  const [method, setMethod] = useState<"equal" | "fixed" | "percentage" | "items">("equal");
  const [items, setItems] = useState<
    { name: string; quantity: string; price: string; email: string }[]
  >([]);
  const [error, setError] = useState("");
  const createExpense = useMutation(trpc.expense.create.mutationOptions());
  const groups = useInfiniteQuery(
    trpc.group.list.infiniteQueryOptions(
      { status: "active", limit: 50 },
      { getNextPageParam: (page) => page.nextCursor ?? undefined },
    ),
  );

  async function selectGroup(id: string) {
    setError("");

    if (!id) {
      setGroup("");
      return;
    }

    setIsLoadingGroup(true);
    try {
      const data = await queryClient.fetchQuery(trpc.group.get.queryOptions({ id }));
      if (data.archivedAt) throw new Error("This group is archived.");
      setParticipants(
        data.participants.map((person) => ({
          name: person.name,
          email: person.email,
          share: "0",
          paid: false,
        })),
      );
      setGroup(id);
      setPayer(
        data.participants.some((person) => person.email === user.email)
          ? user.email
          : (data.participants[0]?.email ?? ""),
      );
      setItems([]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load group.");
    } finally {
      setIsLoadingGroup(false);
    }
  }

  return (
    <div className="space-y-4">
      <ScreenHeader backHref={dashboardRoutes.home} title="Create expense" />
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (createExpense.isPending || isLoadingGroup) return;
          setError("");

          if (participants.length < 2) {
            toast.error("Add another participant", {
              description: "An expense needs at least two participants.",
            });
            return;
          }

          const form = new FormData(event.currentTarget);
          const toastId = toast.loading("Creating expense", {
            description: "Saving your expense, hang tight.",
          });

          try {
            const result = await createExpense.mutateAsync({
              title: String(form.get("title")).trim(),
              totalMinor: toMinor(String(form.get("amount"))),
              currency: String(form.get("currency")),
              category: String(form.get("category")) as keyof typeof expenseCategories,
              occurredAt: new Date(`${form.get("date")}T12:00:00`).getTime(),
              splitMethod: method,
              payer: payer.toLowerCase().trim(),
              groupId: group || undefined,
              createGroup: !group && form.get("createGroup") === "on",
              participants: participants.map((person) => ({
                name: person.name.trim(),
                email: person.email.trim().toLowerCase(),
                owedMinor: ["fixed", "percentage"].includes(method) ? toMinor(person.share) : 0,
                status: person.paid ? "paid" : "unpaid",
              })),
              items:
                method === "items"
                  ? items.map((item) => ({
                      name: item.name.trim(),
                      quantity: Number(item.quantity),
                      priceMinor: toMinor(item.price),
                      participantEmail: item.email.trim().toLowerCase(),
                    }))
                  : [],
            });
            await refreshDashboard();
            toast.success("Expense created successfully", {
              id: toastId,
              description: "Your expense has been created.",
            });
            router.push(dashboardRoutes.expense(result.id));
          } catch (error) {
            const message = error instanceof Error ? error.message : "Could not create expense.";
            setError(message);
            toast.error("Failed to create expense", { id: toastId, description: message });
          }
        }}
      >
        <fieldset
          disabled={createExpense.isPending || isLoadingGroup}
          className="space-y-4 disabled:opacity-60"
        >
          <section className="panel grid gap-4 sm:grid-cols-2">
            <label className="field sm:col-span-2">
              Title
              <input name="title" required placeholder="Dinner with friends" />
            </label>
            <label className="field">
              Amount
              <input
                name="amount"
                required
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                className="font-semibold"
              />
            </label>
            <label className="field">
              Currency
              <select name="currency">
                <option>PHP</option>
              </select>
            </label>
            <label className="field">
              Date
              <input
                name="date"
                type="date"
                required
                defaultValue={new Date().toLocaleDateString("en-CA")}
              />
            </label>
            <label className="field">
              Category
              <select name="category">
                {Object.entries(expenseCategories).map(([value, category]) => (
                  <option key={value} value={value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="panel space-y-2">
            <label className="field">
              Group
              <select value={group} onChange={(event) => void selectGroup(event.target.value)}>
                <option value="">No group</option>
                {initialGroup &&
                !groups.data?.pages.some((page) =>
                  page.items.some((item) => item.id === initialGroup.id),
                ) ? (
                  <option value={initialGroup.id}>{initialGroup.name}</option>
                ) : null}
                {groups.data?.pages
                  .flatMap((page) => page.items)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
            {groups.isError ? (
              <button
                type="button"
                className="min-h-11 text-sm text-destructive"
                onClick={() => void groups.refetch()}
              >
                Could not load groups. Retry
              </button>
            ) : null}
            {groups.hasNextPage ? (
              <button
                type="button"
                className="min-h-11 text-sm text-supporting underline"
                disabled={groups.isFetchingNextPage}
                onClick={() => void groups.fetchNextPage()}
              >
                Load more groups
              </button>
            ) : null}
            {!group ? (
              <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
                <input name="createGroup" type="checkbox" className="size-4" />
                Create a group from this expense
              </label>
            ) : null}
          </section>

          <div className="panel grid gap-4 sm:grid-cols-2">
            <label className="field">
              Split method
              <select
                value={method}
                onChange={(event) => setMethod(event.target.value as typeof method)}
              >
                <option value="equal">Equally</option>
                <option value="fixed">Fixed amounts</option>
                <option value="percentage">Percentages</option>
                <option value="items">By items</option>
              </select>
            </label>
            <label className="field">
              Paid by
              <select required value={payer} onChange={(event) => setPayer(event.target.value)}>
                <option value="">Select payer</option>
                {participants.map((person, index) => (
                  <option key={index} value={person.email}>
                    {person.name || person.email}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Participants
            participants={participants}
            setParticipants={setParticipants}
            splitMethod={method}
          />

          {method === "items" ? (
            <section className="space-y-2">
              <h2 className="text-sm text-ink">Items</h2>
              <div className="panel space-y-4">
                <p className="text-xs text-supporting">
                  Enter the total price for each line, including its quantity. Line totals must
                  match the expense amount.
                </p>
                {items.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="dashed-divider" />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="field">
                        Item name
                        <input
                          required
                          value={item.name}
                          onChange={(event) =>
                            setItems(
                              items.map((entry, position) =>
                                position === index ? { ...entry, name: event.target.value } : entry,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className="field">
                        Quantity
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={item.quantity}
                          onChange={(event) =>
                            setItems(
                              items.map((entry, position) =>
                                position === index
                                  ? { ...entry, quantity: event.target.value }
                                  : entry,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className="field">
                        Line total
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          className="font-semibold"
                          value={item.price}
                          onChange={(event) =>
                            setItems(
                              items.map((entry, position) =>
                                position === index
                                  ? { ...entry, price: event.target.value }
                                  : entry,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className="field">
                        Assigned to
                        <select
                          required
                          value={item.email}
                          onChange={(event) =>
                            setItems(
                              items.map((entry, position) =>
                                position === index
                                  ? { ...entry, email: event.target.value }
                                  : entry,
                              ),
                            )
                          }
                        >
                          <option value="">Select person</option>
                          {participants.map((person, position) => (
                            <option key={position} value={person.email}>
                              {person.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <button
                      type="button"
                      className="min-h-11 text-xs text-destructive"
                      onClick={() => setItems(items.filter((_, position) => position !== index))}
                    >
                      Remove item
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="action-secondary w-full"
                  onClick={() =>
                    setItems([...items, { name: "", quantity: "1", price: "", email: "" }])
                  }
                >
                  Add item
                </button>
              </div>
            </section>
          ) : null}

          <p className="text-xs text-supporting">
            Review the amount, payer, and participants before creating. The payer’s share is marked
            paid automatically.
          </p>
          <button
            type="submit"
            className="action w-full bg-contrast-gradient"
            disabled={!participants.length}
          >
            {createExpense.isPending
              ? "Creating…"
              : isLoadingGroup
                ? "Loading group…"
                : "Create expense"}
          </button>
        </fieldset>
        {error ? (
          <p role="alert" className="text-sm break-words text-destructive">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
