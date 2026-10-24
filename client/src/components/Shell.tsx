import { LayoutDashboard, Plus, Users } from "lucide-react";
import type { ReactNode } from "react";
import { loadRecent } from "../lib/recentGroups";
import { cn } from "./ui";
import { Logo } from "./Logo";

export function Shell({ path, children }: { path: string; children: ReactNode }) {
  const recent = loadRecent().slice(0, 6);
  const nav = [
    { href: "#/app", label: "Dashboard", icon: LayoutDashboard, active: path === "/app" },
    { href: "#/app/new", label: "New group", icon: Plus, active: path === "/app/new" },
  ];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r border-line bg-surface/60 p-4 lg:flex">
        <a href="#/" className="px-2 pt-1">
          <Logo />
        </a>
        <nav className="grid gap-1" aria-label="Main">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-white/[0.05]",
                item.active ? "bg-white/[0.07] text-ink" : "text-muted",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </a>
          ))}
        </nav>
        <div className="min-h-0 overflow-y-auto">
          <p className="px-3 pb-2 text-xs font-medium tracking-wide text-muted uppercase">Recent groups</p>
          {recent.length === 0 ? (
            <p className="px-3 text-sm text-muted">None yet</p>
          ) : (
            <ul className="grid gap-1">
              {recent.map((g) => (
                <li key={g.id}>
                  <a
                    href={`#/app/groups/${g.id}`}
                    className="flex items-center gap-3 truncate rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-white/[0.05] hover:text-ink"
                  >
                    <Users className="size-4 shrink-0" />
                    <span className="truncate">{g.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <div className="min-w-0">
        <nav className="flex items-center gap-1 overflow-x-auto border-b border-line bg-surface/60 px-4 py-3 backdrop-blur lg:hidden" aria-label="Main">
          <a href="#/" className="mr-2 shrink-0">
            <Logo />
          </a>
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium",
                item.active ? "bg-white/[0.07] text-ink" : "text-muted",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </a>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12">{children}</main>
      </div>
    </div>
  );
}
