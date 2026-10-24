import { ArrowRight, Plus, Receipt, Users, Wallet } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { api, type Group } from "../api";
import { Avatar, AvatarStack, Button, Card, CardTitle, EmptyState, Skeleton, cn } from "../components/ui";
import { money, relativeDate } from "../lib/format";
import { go } from "../lib/route";
import { loadRecent } from "../lib/recentGroups";

type Activity = { id: number; groupId: number; groupName: string; description: string; amountCents: number; paidBy: string; createdAt: string };

export function Dashboard() {
  const [groups, setGroups] = useState<Group[] | null>(null);

  useEffect(() => {
    const recent = loadRecent();
    let cancelled = false;
    Promise.allSettled(recent.map((r) => api.getGroup(r.id))).then((results) => {
      if (cancelled) return;
      setGroups(results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (groups === null) return <DashboardSkeleton />;

  const totalSpent = groups.reduce((sum, g) => sum + g.expenses.reduce((s, e) => s + e.amountCents, 0), 0);
  const openPayments = groups.reduce((sum, g) => sum + g.settlements.length, 0);
  const activity: Activity[] = groups
    .flatMap((g) =>
      g.expenses.map((e) => ({
        id: e.id,
        groupId: g.id,
        groupName: g.name,
        description: e.description,
        amountCents: e.amountCents,
        paidBy: g.members.find((m) => m.id === e.paidBy)?.name ?? "Someone",
        createdAt: e.createdAt,
      })),
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 8);

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="rise flex flex-wrap items-end justify-between gap-4" style={{ "--i": 0 } as React.CSSProperties}>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Overview</h1>
          <p className="mt-1 text-sm text-muted">Groups you've opened on this device.</p>
        </div>
        <Button variant="primary" onClick={() => go("/app/new")}>
          <Plus className="size-4" />
          New group
        </Button>
      </div>

      <div className="rise grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" style={{ "--i": 1 } as React.CSSProperties}>
        <Stat icon={<Users className="size-4" />} label="Groups" value={String(groups.length)} />
        <Stat icon={<Wallet className="size-4" />} label="Total tracked" value={money(totalSpent)} />
        <Stat icon={<ArrowRight className="size-4" />} label="Payments open" value={String(openPayments)} />
        <Stat icon={<Receipt className="size-4" />} label="Expenses" value={String(groups.reduce((s, g) => s + g.expenses.length, 0))} />
      </div>

      {groups.length === 0 ? (
        <Card className="rise" >
          <EmptyState
            icon={<Users className="size-5" />}
            title="No groups yet"
            body="Create a group for your next trip, apartment, or dinner. It will appear here."
            action={
              <Button variant="primary" onClick={() => go("/app/new")}>
                <Plus className="size-4" />
                Create your first group
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <section className="rise grid content-start gap-4" style={{ "--i": 2 } as React.CSSProperties}>
            <h2 className="text-[15px] font-semibold tracking-tight">Groups</h2>
            <div className="grid gap-2.5">
              {groups.map((g) => {
                const spent = g.expenses.reduce((s, e) => s + e.amountCents, 0);
                const settled = g.expenses.length > 0 && g.settlements.length === 0;
                return (
                  <a
                    key={g.id}
                    href={`#/app/groups/${g.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-4 transition duration-200 hover:border-white/15 hover:bg-raised/60 sm:gap-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{g.name}</p>
                      <p className="mt-0.5 text-sm text-muted tabular-nums">{money(spent)} spent</p>
                    </div>
                    <div className="hidden sm:block">
                      <AvatarStack members={g.members} />
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                        settled ? "bg-positive/10 text-positive" : "bg-white/[0.06] text-muted",
                      )}
                    >
                      {settled ? "Settled" : `${g.settlements.length} to settle`}
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
                  </a>
                );
              })}
            </div>
          </section>

          <Card className="rise self-start" style={{ "--i": 3 } as React.CSSProperties}>
            <CardTitle>Recent activity</CardTitle>
            {activity.length === 0 ? (
              <p className="text-sm text-muted">Expenses you log will show up here.</p>
            ) : (
              <ol className="grid gap-1">
                {activity.map((a) => {
                  const payer = groups.find((g) => g.id === a.groupId)?.members.find((m) => m.name === a.paidBy);
                  return (
                    <li key={`${a.groupId}-${a.id}`}>
                      <a href={`#/app/groups/${a.groupId}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.04]">
                        {payer ? <Avatar member={payer} size="sm" /> : <span className="size-6" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{a.description}</p>
                          <p className="truncate text-xs text-muted">
                            {a.paidBy} · {a.groupName} · {relativeDate(a.createdAt)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">{money(a.amountCents)}</span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-medium text-muted">
        <span className="text-accent">{icon}</span>
        {label}
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}
