import { useSelector, type AnyFormApi } from "@tanstack/react-form";
import type { ReactNode } from "react";
import type { ExpenseFormValues } from "./expense-form-model";

// TanStack Subscribe compares with ===; object selectors notify on every validation update.
export function ExpenseFormSubscribe<T extends readonly unknown[]>({
  form,
  selector,
  children,
}: {
  form: Pick<AnyFormApi, "store">;
  selector: (state: { values: ExpenseFormValues; isSubmitting: boolean }) => T;
  children: (value: T) => ReactNode;
}) {
  const value = useSelector(form.store, selector, {
    compare: (previous, next) =>
      previous.length === next.length &&
      previous.every((item, index) => Object.is(item, next[index])),
  });
  return children(value);
}
