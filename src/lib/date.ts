const APP_TIMEZONE = "Asia/Jakarta";

function parseStoredDate(value: string): Date {
  const normalized = value.trim().replace(" ", "T");

  // SQLite CURRENT_TIMESTAMP is UTC and has no timezone suffix.
  // If a value already carries a timezone, don't append another one.
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(normalized)) {
    return new Date(normalized);
  }

  return new Date(`${normalized}Z`);
}

export function formatTanggal(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
): string {
  return new Intl.DateTimeFormat("id-ID", {
    ...options,
    timeZone: APP_TIMEZONE,
  }).format(parseStoredDate(value));
}

export function formatTanggalWaktu(value: string): string {
  return formatTanggal(value, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatTanggalSitemap(value: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(parseStoredDate(value));

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    return year && month && day ? `${year}-${month}-${day}` : null;
  } catch {
    return null;
  }
}
