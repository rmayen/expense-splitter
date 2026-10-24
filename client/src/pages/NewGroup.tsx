import { ArrowLeft, Plus, X } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { api } from "../api";
import { Button, Card, Field, Input, cn } from "../components/ui";
import { rememberGroup } from "../lib/recentGroups";
import { go } from "../lib/route";

export function NewGroup() {
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addPerson() {
    const trimmed = draft.trim();
    if (!trimmed || people.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setDraft("");
      return;
    }
    setPeople([...people, trimmed]);
    setDraft("");
  }

  function onDraftKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addPerson();
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const group = await api.createGroup(name.trim());
      // Add people in order so the member list matches the order they were typed in.
      for (const person of people) await api.addMember(group.id, person);
      rememberGroup(group.id, group.name);
      go(`/app/groups/${group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the group");
      setBusy(false);
    }
  }

  return (
    <div className="rise mx-auto grid max-w-xl gap-6" style={{ "--i": 0 } as React.CSSProperties}>
      <div>
        <Button variant="ghost" size="sm" onClick={() => go("/app")} className="-ml-3">
          <ArrowLeft className="size-4" />
          Dashboard
        </Button>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Create a group</h1>
        <p className="mt-1 text-sm text-muted">Name it, then add the people sharing costs. You can add more later.</p>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="grid gap-6">
          <Field label="Group name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Spring break, Apartment 4B, Friday dinners"
              maxLength={80}
              autoFocus
              required
            />
          </Field>

          <Field label="People" hint="Press Enter or comma after each name.">
            <div className="grid gap-3">
              <div className="flex gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onDraftKey}
                  placeholder="Add a name"
                  maxLength={60}
                  aria-label="Person's name"
                />
                <Button onClick={addPerson} disabled={!draft.trim()} aria-label="Add person">
                  <Plus className="size-4" />
                </Button>
              </div>
              {people.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {people.map((p) => (
                    <li
                      key={p}
                      className={cn("flex items-center gap-1.5 rounded-full border border-line bg-raised py-1 pr-1 pl-3 text-sm")}
                    >
                      {p}
                      <button
                        type="button"
                        aria-label={`Remove ${p}`}
                        onClick={() => setPeople(people.filter((x) => x !== p))}
                        className="grid size-6 cursor-pointer place-items-center rounded-full text-muted transition hover:bg-white/10 hover:text-ink"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Field>

          {error && <p className="text-sm text-negative">{error}</p>}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" onClick={() => go("/app")}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={busy || !name.trim()}>
              {busy ? "Creating…" : "Create group"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
