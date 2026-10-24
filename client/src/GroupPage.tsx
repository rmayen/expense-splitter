import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, formatMoney, type Group } from "./api";

export function GroupPage({ groupId }: { groupId: number }) {
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setGroup(await api.getGroup(groupId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load group");
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !group) return <p className="error">{error}</p>;
  if (!group) return <p className="muted">Loading…</p>;

  const nameOf = (id: number) => group.members.find((m) => m.id === id)?.name ?? "Unknown";

  return (
    <div className="stack">
      <section className="card">
        <h1>{group.name}</h1>
        <p className="muted">Share this page's link so everyone can add expenses.</p>
        <MemberForm groupId={groupId} members={group.members} onChange={load} />
      </section>

      {error && <p className="error">{error}</p>}

      <div className="grid">
        <section className="card">
          <h2>Balances</h2>
          {group.members.length === 0 && <p className="muted">Add members to get started.</p>}
          <ul className="list">
            {group.balances.map((b) => (
              <li key={b.memberId}>
                <span>{nameOf(b.memberId)}</span>
                <span className={b.balanceCents >= 0 ? "positive" : "negative"}>
                  {b.balanceCents >= 0 ? "gets back " : "owes "}
                  {formatMoney(Math.abs(b.balanceCents))}
                </span>
              </li>
            ))}
          </ul>

          <h2>Settle up</h2>
          {group.settlements.length === 0 ? (
            <p className="muted">Everyone is square.</p>
          ) : (
            <ul className="list">
              {group.settlements.map((s) => (
                <li key={`${s.from}-${s.to}`}>
                  <span>
                    {nameOf(s.from)} pays {nameOf(s.to)}
                  </span>
                  <strong>{formatMoney(s.amountCents)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>Add an expense</h2>
          <ExpenseForm groupId={groupId} members={group.members} onChange={load} />
        </section>
      </div>

      <section className="card">
        <h2>Expenses</h2>
        {group.expenses.length === 0 && <p className="muted">No expenses yet.</p>}
        <ul className="list">
          {group.expenses.map((e) => (
            <li key={e.id}>
              <div>
                <strong>{e.description}</strong>
                <div className="muted small">
                  {nameOf(e.paidBy)} paid {formatMoney(e.amountCents)} · split {e.participantIds.length} ways
                </div>
              </div>
              <button
                className="ghost"
                onClick={async () => {
                  await api.deleteExpense(groupId, e.id);
                  load();
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MemberForm({
  groupId,
  members,
  onChange,
}: {
  groupId: number;
  members: { id: number; name: string }[];
  onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await api.addMember(groupId, name);
      setName("");
      setError(null);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add member");
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a person" maxLength={60} />
        <button type="submit" disabled={!name.trim()}>
          Add
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      <p className="chips">
        {members.map((m) => (
          <span key={m.id} className="chip">
            {m.name}
          </span>
        ))}
      </p>
    </>
  );
}

function ExpenseForm({
  groupId,
  members,
  onChange,
}: {
  groupId: number;
  members: { id: number; name: string }[];
  onChange: () => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<number | null>(null);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Everyone splits by default, and the first member pays, until the user changes it.
  const payer = paidBy ?? members[0]?.id ?? null;
  const splitWith = members.filter((m) => !excluded.includes(m.id)).map((m) => m.id);

  function toggle(id: number) {
    setExcluded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (payer === null) return;
    try {
      await api.addExpense(groupId, { description, amount, paidBy: payer, participantIds: splitWith });
      setDescription("");
      setAmount("");
      setError(null);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add expense");
    }
  }

  if (members.length === 0) return <p className="muted">Add at least one person first.</p>;

  return (
    <form onSubmit={onSubmit} className="stack">
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was it for?" maxLength={120} required />
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount, e.g. 24.50" inputMode="decimal" required />
      <label>
        Paid by
        <select value={payer ?? ""} onChange={(e) => setPaidBy(Number(e.target.value))}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>Split between</legend>
        {members.map((m) => (
          <label key={m.id} className="check">
            <input type="checkbox" checked={splitWith.includes(m.id)} onChange={() => toggle(m.id)} />
            {m.name}
          </label>
        ))}
      </fieldset>
      <button type="submit" disabled={!description.trim() || !amount.trim() || splitWith.length === 0}>
        Add expense
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
