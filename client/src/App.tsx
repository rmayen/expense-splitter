import { useEffect, useState, type FormEvent } from "react";
import { api } from "./api";
import { GroupPage } from "./GroupPage";

// Groups are addressed by id in the URL hash (#/groups/3). There is no login, so anyone
// with the link can view and edit the group.
function groupIdFromHash(): number | null {
  const match = window.location.hash.match(/^#\/groups\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

export function App() {
  const [groupId, setGroupId] = useState(groupIdFromHash);

  useEffect(() => {
    const onHashChange = () => setGroupId(groupIdFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">
          Expense Splitter
        </a>
      </header>
      <main>{groupId === null ? <NewGroup /> : <GroupPage key={groupId} groupId={groupId} />}</main>
    </div>
  );
}

function NewGroup() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const group = await api.createGroup(name);
      window.location.hash = `#/groups/${group.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card hero">
      <h1>Split expenses without the math.</h1>
      <p className="muted">
        Create a group, add everyone, and log what you spend. We'll work out who owes whom and the fewest
        payments needed to settle up.
      </p>
      <form onSubmit={onSubmit} className="row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name, e.g. Spring break"
          maxLength={80}
          required
        />
        <button type="submit" disabled={busy || !name.trim()}>
          Create group
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
