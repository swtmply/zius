const currencyFormatters = new Map<string, Intl.NumberFormat>();

const shortDateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function formatCurrency(minor: number, currency = "PHP") {
  let formatter = currencyFormatters.get(currency);

  if (!formatter) {
    formatter = new Intl.NumberFormat("en-PH", { style: "currency", currency });
    currencyFormatters.set(currency, formatter);
  }

  return formatter.format(minor / 100);
}

export function formatShortDate(value: string | Date) {
  return shortDateFormatter.format(new Date(value));
}

export function formatLongDate(value: string | Date) {
  return longDateFormatter.format(new Date(value));
}
