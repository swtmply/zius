export function toMinor(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value))
    throw new Error("Enter an amount with at most two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount)) throw new Error("Enter a smaller amount.");
  return amount;
}
