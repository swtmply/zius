const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

// Convert date to MMMM DD, YYYY
const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value / 100);
}

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}
