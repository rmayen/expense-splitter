const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function money(cents: number): string {
  return currency.format(cents / 100);
}

// SQLite stores UTC as "YYYY-MM-DD HH:MM:SS".
export function shortDate(sqlTimestamp: string): string {
  return new Date(sqlTimestamp.replace(" ", "T") + "Z").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function relativeDate(sqlTimestamp: string): string {
  const diffDays = Math.floor((Date.now() - new Date(sqlTimestamp.replace(" ", "T") + "Z").getTime()) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return shortDate(sqlTimestamp);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#fb923c", "#22d3ee"];

export function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}
