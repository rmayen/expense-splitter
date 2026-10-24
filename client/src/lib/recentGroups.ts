// Groups are not listed by the server (that would expose other people's groups), so the
// dashboard shows the groups this browser has created or opened.
export type RecentGroup = { id: number; name: string; visitedAt: number };

const KEY = "expense-splitter:recent-groups";

export function loadRecent(): RecentGroup[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentGroup[]) : [];
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The dashboard just starts empty.
    return [];
  }
}

export function rememberGroup(id: number, name: string): void {
  try {
    const rest = loadRecent().filter((g) => g.id !== id);
    const next = [{ id, name, visitedAt: Date.now() }, ...rest].slice(0, 24);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Same as above: remembering is a convenience, so failures are ignored.
  }
}
