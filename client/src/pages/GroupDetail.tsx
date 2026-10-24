import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Copy, Plus, Receipt, Trash2, UserPlus, Users, Wallet } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api, type Group, type Member } from "../api";
import { Avatar, AvatarStack, Button, Card, CardTitle, EmptyState, Field, Input, Modal, Skeleton, cn } from "../components/ui";
import { money, shortDate } from "../lib/format";
import { go } from "../lib/route";
import { rememberGroup } from "../lib/recentGroups";

const ease = [0.2, 0.7, 0.2, 1] as const;

export function GroupDetail({ groupId }: { groupId: number }) {
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await api.getGroup(groupId);
      setGroup(next);
      rememberGroup(next.id, next.name);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this group");
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!group) {
    if (error) {
      return (
        <EmptyState
          icon={<Users className="size-5" />}
          title="Group not found"
          body={error}
          action={
            <Button onClick={() => go("/app")}>
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Button>
          }
        />
      );
    }
    return <GroupSkeleton />;
  }

  const memberById = new Map(group.members.map((m) => [m.id, m]));
  const nameOf = (id: number): Member => memberById.get(id) ?? { id, name: "Unknown" };
  const totalCents = group.expenses.reduce((sum, e) => sum + e.amountCents, 0);
  const settled = group.expenses.length > 0 && group.settlements.length === 0;

  return (
    <div className="grid grid-cols-1 gap-8">
      <header className="rise grid gap-5" style={{ "--i": 0 } as React.CSSProperties}>
        <div>
          <Button variant="ghost" size="sm" onClick={() => go("/app")} className="-ml-3">
            <ArrowLeft className="size-4" />
            Dashboard
          </Button>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{group.name}</h1>
              {settled && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/10 px-2.5 py-1 text-xs font-medium text-positive">
                  <Check className="size-3.5" /> All square
                </span>
              )}
            </div>
            <div className="mt-3">
              <AvatarStack members={group.members} max={8} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyLink />
            <Button onClick={() => setMembersOpen(true)}>
              <UserPlus className="size-4" />
              People
            </Button>
            <Button variant="primary" onClick={() => setExpenseOpen(true)} disabled={group.members.length === 0}>
              <Plus className="size-4" />
              Add expense
            </Button>
          </div>
        </div>
      </header>

      {error && <p className="text-sm text-negative">{error}</p>}

      <div className="rise grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4" style={{ "--i": 1 } as React.CSSProperties}>
        <Stat icon={<Wallet className="size-4" />} label="Total spent" value={money(totalCents)} />
        <Stat icon={<Receipt className="size-4" />} label="Expenses" value={String(group.expenses.length)} />
        <Stat icon={<ArrowRight className="size-4" />} label="Payments left" value={String(group.settlements.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Card className="rise" >
          <CardTitle>Balances</CardTitle>
          {group.members.length === 0 ? (
            <EmptyState icon={<Users className="size-5" />} title="No one here yet" body="Add the people sharing costs to start tracking balances." action={<Button onClick={() => setMembersOpen(true)}>Add people</Button>} />
          ) : (
            <BalanceChart group={group} nameOf={nameOf} />
          )}
        </Card>

        <div className="grid content-start gap-6">
          <Card className="rise" >
            <CardTitle>Who owes whom</CardTitle>
            {group.settlements.length === 0 ? (
              <p className="text-sm text-muted">{group.expenses.length === 0 ? "Log an expense to see who owes whom." : "Nothing to settle. Everyone is square."}</p>
            ) : (
              <ul className="grid gap-2">
                {group.settlements.map((s) => (
                  <li key={`${s.from}-${s.to}`} className="flex items-center gap-3 rounded-xl border border-line bg-raised/50 px-3.5 py-3">
                    <Avatar member={nameOf(s.from)} size="sm" />
                    <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
                    <Avatar member={nameOf(s.to)} size="sm" />
                    <p className="min-w-0 flex-1 truncate text-sm">
                      <span className="font-medium">{nameOf(s.from).name}</span>
                      <span className="text-muted"> pays </span>
                      <span className="font-medium">{nameOf(s.to).name}</span>
                    </p>
                    <span className="text-sm font-semibold tabular-nums">{money(s.amountCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="rise">
            <CardTitle>Paid by</CardTitle>
            <PaidBreakdown group={group} nameOf={nameOf} />
          </Card>
        </div>
      </div>

      <Card className="rise">
        <CardTitle>Expenses</CardTitle>
        {group.expenses.length === 0 ? (
          <EmptyState
            icon={<Receipt className="size-5" />}
            title="No expenses yet"
            body="Log a dinner, a cab, or a grocery run and the balances update instantly."
            action={
              <Button variant="primary" onClick={() => setExpenseOpen(true)} disabled={group.members.length === 0}>
                <Plus className="size-4" />
                Add the first expense
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {group.expenses.map((e) => (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25, ease }}
                  className="group flex items-center gap-4 py-3.5"
                >
                  <Avatar member={nameOf(e.paidBy)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.description}</p>
                    <p className="truncate text-xs text-muted">
                      {nameOf(e.paidBy).name} paid · split {e.participantIds.length} ways · {shortDate(e.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{money(e.amountCents)}</span>
                  <DeleteExpense
                    description={e.description}
                    onDelete={async () => {
                      try {
                        await api.deleteExpense(groupId, e.id);
                        load();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Could not delete the expense");
                      }
                    }}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>

      <AddExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} groupId={groupId} members={group.members} onAdded={load} />
      <MembersModal open={membersOpen} onClose={() => setMembersOpen(false)} groupId={groupId} members={group.members} onAdded={load} />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs font-medium text-muted">
        <span className="text-accent">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-3 truncate text-lg font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p>
    </Card>
  );
}

function BalanceChart({ group, nameOf }: { group: Group; nameOf: (id: number) => Member }) {
  const largest = Math.max(1, ...group.balances.map((b) => Math.abs(b.balanceCents)));
  return (
    <ul className="grid gap-5">
      {group.balances.map((b, i) => {
        const positive = b.balanceCents >= 0;
        const half = (Math.abs(b.balanceCents) / largest) * 50;
        return (
          <li key={b.memberId} className="rise" style={{ "--i": i + 2 } as React.CSSProperties}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2.5">
                <Avatar member={nameOf(b.memberId)} size="sm" />
                <span className="truncate font-medium">{nameOf(b.memberId).name}</span>
              </span>
              <span className={cn("font-semibold tabular-nums", b.balanceCents === 0 ? "text-muted" : positive ? "text-positive" : "text-negative")}>
                {b.balanceCents === 0 ? "Square" : `${positive ? "gets back " : "owes "}${money(Math.abs(b.balanceCents))}`}
              </span>
            </div>
            <div className="relative mt-2.5 h-2 rounded-full bg-white/[0.06]" role="img" aria-label={`${nameOf(b.memberId).name} ${positive ? "is owed" : "owes"} ${money(Math.abs(b.balanceCents))}`}>
              <span className="absolute inset-y-[-3px] left-1/2 w-px bg-line" />
              {b.balanceCents !== 0 && (
                <motion.span
                  className={cn("absolute inset-y-0 rounded-full", positive ? "bg-positive" : "bg-negative")}
                  style={positive ? { left: "50%" } : { right: "50%" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${half}%` }}
                  transition={{ duration: 0.8, ease }}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PaidBreakdown({ group, nameOf }: { group: Group; nameOf: (id: number) => Member }) {
  const paid = new Map<number, number>();
  for (const e of group.expenses) paid.set(e.paidBy, (paid.get(e.paidBy) ?? 0) + e.amountCents);
  const rows = [...paid.entries()].sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((s, [, v]) => s + v, 0);

  if (rows.length === 0) return <p className="text-sm text-muted">Nothing paid yet.</p>;

  return (
    <ul className="grid gap-4">
      {rows.map(([id, cents], i) => {
        const share = (cents / total) * 100;
        return (
          <li key={id} className="rise" style={{ "--i": i + 4 } as React.CSSProperties}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium">{nameOf(id).name}</span>
              <span className="tabular-nums text-muted">
                {money(cents)} · {Math.round(share)}%
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/[0.06]">
              <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${share}%` }} transition={{ duration: 0.8, ease }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function CopyLink() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked. The link is still in the address bar.
    }
  }

  return (
    <Button onClick={copy}>
      {copied ? <Check className="size-4 text-positive" /> : <Copy className="size-4" />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

function DeleteExpense({ description, onDelete }: { description: string; onDelete: () => void }) {
  return (
    <Button variant="ghost" size="sm" aria-label={`Delete ${description}`} onClick={onDelete} className="size-8 p-0 opacity-70 hover:text-negative group-hover:opacity-100">
      <Trash2 className="size-4" />
    </Button>
  );
}

function AddExpenseModal({
  open,
  onClose,
  groupId,
  members,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  groupId: number;
  members: Member[];
  onAdded: () => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<number | null>(null);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payer = paidBy ?? members[0]?.id;
  const splitWith = members.filter((m) => !excluded.includes(m.id)).map((m) => m.id);
  const amountNumber = Number(amount);
  const validAmount = /^\d+(\.\d{1,2})?$/.test(amount) && amountNumber > 0;
  const perPerson = validAmount && splitWith.length > 0 ? Math.floor((amountNumber * 100) / splitWith.length) / 100 : null;

  function toggleSplit(id: number) {
    setExcluded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (payer === undefined) return;
    setBusy(true);
    setError(null);
    try {
      await api.addExpense(groupId, { description: description.trim(), amount, paidBy: payer, participantIds: splitWith });
      setDescription("");
      setAmount("");
      setPaidBy(null);
      setExcluded([]);
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the expense");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add an expense" description="Who paid, and who shares the cost?">
      <form onSubmit={onSubmit} className="grid gap-5">
        <Field label="What for">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Dinner, cab, groceries" maxLength={120} required autoFocus />
        </Field>

        <Field label="Amount">
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-muted">$</span>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" className="pl-7 tabular-nums" required />
          </div>
        </Field>

        <div className="grid gap-2">
          <span className="text-[13px] font-medium text-muted">Paid by</span>
          <Chips members={members} isOn={(id) => payer === id} onPick={(id) => setPaidBy(id)} />
        </div>

        <div className="grid gap-2">
          <span className="text-[13px] font-medium text-muted">Split between</span>
          <Chips members={members} isOn={(id) => !excluded.includes(id)} onPick={toggleSplit} />
          <p className="text-xs text-muted">
            {perPerson !== null ? `${money(Math.round(perPerson * 100))} each, ${splitWith.length} ${splitWith.length === 1 ? "person" : "people"}` : "Choose an amount and at least one person."}
          </p>
        </div>

        {error && <p className="text-sm text-negative">{error}</p>}

        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={busy || !description.trim() || !validAmount || splitWith.length === 0}>
            {busy ? "Adding…" : "Add expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Chips({ members, isOn, onPick }: { members: Member[]; isOn: (id: number) => boolean; onPick: (id: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {members.map((m) => {
        const on = isOn(m.id);
        return (
          <button
            key={m.id}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(m.id)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full border py-1 pr-3.5 pl-1 text-sm transition duration-200",
              on ? "border-accent/60 bg-accent/10 text-ink" : "border-line text-muted hover:border-white/20 hover:text-ink",
            )}
          >
            <Avatar member={m} size="sm" />
            {m.name}
          </button>
        );
      })}
    </div>
  );
}

function MembersModal({
  open,
  onClose,
  groupId,
  members,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  groupId: number;
  members: Member[];
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await api.addMember(groupId, name.trim());
      setName("");
      setError(null);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that person");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="People" description="Everyone who shares costs in this group.">
      <div className="grid gap-5">
        <ul className="grid max-h-64 gap-1 overflow-y-auto">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
              <Avatar member={m} size="sm" />
              <span className="text-sm font-medium">{m.name}</span>
            </li>
          ))}
          {members.length === 0 && <li className="px-2 py-2 text-sm text-muted">No one yet.</li>}
        </ul>
        <form onSubmit={onSubmit} className="grid gap-2">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a person" maxLength={60} aria-label="Person's name" />
            <Button type="submit" variant="primary" disabled={!name.trim()}>
              Add
            </Button>
          </div>
          {error && <p className="text-sm text-negative">{error}</p>}
        </form>
      </div>
    </Modal>
  );
}

function GroupSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8" aria-busy="true" aria-label="Loading group">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
