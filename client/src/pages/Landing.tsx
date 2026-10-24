import { ArrowRight, Check, Receipt, Route, Users, Wallet } from "lucide-react";
import { Avatar, Button } from "../components/ui";
import { Logo } from "../components/Logo";
import { go } from "../lib/route";

const features = [
  { icon: Users, title: "Everyone in one place", body: "Add people once, then log who paid and who shares each cost." },
  { icon: Receipt, title: "Exact to the cent", body: "Amounts are stored as integer cents, so splits never drift by a penny." },
  { icon: Route, title: "Fewest payments", body: "Debts are netted so the group settles with at most n − 1 transfers." },
  { icon: Wallet, title: "Balances at a glance", body: "See who is owed and who owes, with bars that show the size of each balance." },
];

const demo = [
  { id: 1, name: "Ana", amount: 2510, positive: true, width: 72 },
  { id: 2, name: "Ben", amount: 1255, positive: false, width: 36 },
  { id: 3, name: "Cy", amount: 1255, positive: false, width: 36 },
];

export function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
          <a href="#/" aria-label="Expense Splitter home">
            <Logo />
          </a>
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex" aria-label="Sections">
            <a href="#features" className="transition hover:text-ink">Features</a>
            <a href="#how" className="transition hover:text-ink">How it works</a>
          </nav>
          <Button variant="primary" size="sm" onClick={() => go("/app")}>
            Open app
          </Button>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,rgb(91_140_255/0.16),transparent)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-20 pb-24 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-28">
          <div className="rise" style={{ "--i": 0 } as React.CSSProperties}>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
              <span className="size-1.5 rounded-full bg-positive" />
              Built for trips, roommates and shared dinners
            </span>
            <h1 className="mt-6 text-[clamp(2.6rem,6.4vw,4.5rem)] leading-[1.02] font-semibold tracking-[-0.035em]">
              Split costs.
              <br />
              <span className="bg-gradient-to-r from-accent to-[#6ee7d0] bg-clip-text text-transparent">
                Settle up in fewer payments.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Log what everyone spends. See who owes whom in real time, then settle with the fewest transfers
              needed to get everyone square.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button variant="primary" className="h-12 px-6 text-[15px]" onClick={() => go("/app/new")}>
                Start a group
                <ArrowRight className="size-4" />
              </Button>
              <Button className="h-12 px-6 text-[15px]" onClick={() => go("/app")}>
                Go to dashboard
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["No sign-up", "Cents-accurate", "Works on any device"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="size-4 text-positive" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rise relative" style={{ "--i": 2 } as React.CSSProperties} aria-hidden>
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-2xl shadow-black/40 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted uppercase">Spring break</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">$51.20 spent</p>
                </div>
                <span className="rounded-full bg-positive/10 px-3 py-1 text-xs font-medium text-positive">2 payments left</span>
              </div>

              <div className="mt-7 grid gap-5">
                {demo.map((d) => (
                  <div key={d.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2.5">
                        <Avatar member={d} />
                        <span className="font-medium">{d.name}</span>
                      </span>
                      <span className={d.positive ? "text-positive" : "text-negative"}>
                        {d.positive ? "+" : "−"}${(d.amount / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="relative mt-3 h-2 rounded-full bg-white/[0.06]">
                      <span className="absolute inset-y-0 left-1/2 w-px bg-line" />
                      <span
                        className={
                          d.positive
                            ? "absolute inset-y-0 left-1/2 rounded-full bg-positive"
                            : "absolute inset-y-0 right-1/2 rounded-full bg-negative"
                        }
                        style={{ width: `${d.width / 2}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 grid gap-2.5 border-t border-line pt-6">
                {[
                  { from: "Ben", to: "Ana", amount: "$12.55" },
                  { from: "Cy", to: "Ana", amount: "$12.55" },
                ].map((s) => (
                  <div key={s.from} className="flex items-center justify-between rounded-xl bg-raised px-4 py-3 text-sm">
                    <span className="text-muted">
                      <span className="text-ink">{s.from}</span> pays <span className="text-ink">{s.to}</span>
                    </span>
                    <span className="font-semibold">{s.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-accent">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Everything the group needs, nothing it doesn't.</h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-line bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-white/15"
            >
              <div className="grid size-10 place-items-center rounded-xl border border-line bg-raised text-accent transition group-hover:text-positive">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-5 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-medium text-accent">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Three steps to square.</h2>
          </div>
          <ol className="grid gap-4">
            {[
              ["Create a group", "Name it and add everyone who's sharing costs."],
              ["Log expenses", "Pick who paid and who splits each one. Cents are handled for you."],
              ["Settle up", "Follow the short list of payments and everyone is square."],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-5 rounded-2xl border border-line bg-surface p-6">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface px-8 py-14 text-center sm:px-14">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(50%_80%_at_50%_0%,rgb(91_140_255/0.14),transparent)]" />
          <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">Ready for the next bill?</h2>
          <p className="relative mx-auto mt-3 max-w-md text-muted">Start a group in seconds. No account needed.</p>
          <div className="relative mt-8">
            <Button variant="primary" className="h-12 px-6 text-[15px]" onClick={() => go("/app/new")}>
              Start a group
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <Logo />
          <p>Built with React, Express and SQLite.</p>
        </div>
      </footer>
    </div>
  );
}
