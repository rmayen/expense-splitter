import express, { type NextFunction, type Request, type Response } from "express";
import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import { computeBalances, settle, splitEqually, type Expense } from "./split.js";

// Accepts "12", "12.5" or "12.50" and converts it to integer cents without float rounding.
const amount = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "amount must look like 12 or 12.50")
  .transform((s) => {
    const [dollars, cents = ""] = s.split(".");
    return Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
  })
  .pipe(z.number().int().positive("amount must be greater than zero"));

const createGroupSchema = z.object({ name: z.string().trim().min(1).max(80) });
const createMemberSchema = z.object({ name: z.string().trim().min(1).max(60) });
const createExpenseSchema = z.object({
  description: z.string().trim().min(1).max(120),
  amount,
  paidBy: z.number().int().positive(),
  participantIds: z.array(z.number().int().positive()).min(1),
});

type GroupRow = { id: number; name: string };
type MemberRow = { id: number; name: string };
type ExpenseRow = { id: number; description: string; amount_cents: number; paid_by: number; created_at: string };

export function createApp(db: DatabaseSync) {
  const app = express();
  app.use(express.json());

  const findGroup = (id: number) =>
    db.prepare("SELECT id, name FROM groups WHERE id = ?").get(id) as GroupRow | undefined;

  const groupMemberIds = (groupId: number) =>
    (db.prepare("SELECT id FROM members WHERE group_id = ? ORDER BY id").all(groupId) as { id: number }[]).map(
      (row) => row.id,
    );

  app.post("/api/groups", (req, res) => {
    const { name } = createGroupSchema.parse(req.body);
    const result = db.prepare("INSERT INTO groups (name) VALUES (?)").run(name);
    res.status(201).json({ id: Number(result.lastInsertRowid), name });
  });

  app.get("/api/groups/:id", (req, res) => {
    const group = findGroup(Number(req.params.id));
    if (!group) return res.status(404).json({ error: "group not found" });

    const members = db
      .prepare("SELECT id, name FROM members WHERE group_id = ? ORDER BY id")
      .all(group.id) as MemberRow[];
    const expenseRows = db
      .prepare("SELECT id, description, amount_cents, paid_by, created_at FROM expenses WHERE group_id = ? ORDER BY id DESC")
      .all(group.id) as ExpenseRow[];
    const shareRows = db
      .prepare(
        `SELECT es.expense_id, es.member_id, es.share_cents
         FROM expense_shares es JOIN expenses e ON e.id = es.expense_id
         WHERE e.group_id = ?`,
      )
      .all(group.id) as { expense_id: number; member_id: number; share_cents: number }[];

    const sharesByExpense = new Map<number, { memberId: number; shareCents: number }[]>();
    for (const row of shareRows) {
      const list = sharesByExpense.get(row.expense_id) ?? [];
      list.push({ memberId: row.member_id, shareCents: row.share_cents });
      sharesByExpense.set(row.expense_id, list);
    }

    const expenses = expenseRows.map((row) => ({
      id: row.id,
      description: row.description,
      amountCents: row.amount_cents,
      paidBy: row.paid_by,
      participantIds: (sharesByExpense.get(row.id) ?? []).map((s) => s.memberId),
      createdAt: row.created_at,
    }));

    const ledger: Expense[] = expenseRows.map((row) => ({
      paidBy: row.paid_by,
      amountCents: row.amount_cents,
      shares: sharesByExpense.get(row.id) ?? [],
    }));
    const balances = computeBalances(
      members.map((m) => m.id),
      ledger,
    );

    res.json({
      id: group.id,
      name: group.name,
      members,
      expenses,
      balances: members.map((m) => ({ memberId: m.id, balanceCents: balances.get(m.id) ?? 0 })),
      settlements: settle(balances),
    });
  });

  app.post("/api/groups/:id/members", (req, res) => {
    const group = findGroup(Number(req.params.id));
    if (!group) return res.status(404).json({ error: "group not found" });
    const { name } = createMemberSchema.parse(req.body);
    const result = db.prepare("INSERT INTO members (group_id, name) VALUES (?, ?)").run(group.id, name);
    res.status(201).json({ id: Number(result.lastInsertRowid), name });
  });

  app.post("/api/groups/:id/expenses", (req, res) => {
    const group = findGroup(Number(req.params.id));
    if (!group) return res.status(404).json({ error: "group not found" });

    const body = createExpenseSchema.parse(req.body);
    const memberIds = new Set(groupMemberIds(group.id));
    if (!memberIds.has(body.paidBy)) return res.status(400).json({ error: "payer is not in this group" });
    if (body.participantIds.some((id) => !memberIds.has(id))) {
      return res.status(400).json({ error: "a participant is not in this group" });
    }

    const participants = [...new Set(body.participantIds)];
    const shares = splitEqually(body.amount, participants);

    db.exec("BEGIN");
    try {
      const result = db
        .prepare("INSERT INTO expenses (group_id, description, amount_cents, paid_by) VALUES (?, ?, ?, ?)")
        .run(group.id, body.description, body.amount, body.paidBy);
      const expenseId = Number(result.lastInsertRowid);
      const insertShare = db.prepare("INSERT INTO expense_shares (expense_id, member_id, share_cents) VALUES (?, ?, ?)");
      for (const share of shares) insertShare.run(expenseId, share.memberId, share.shareCents);
      db.exec("COMMIT");
      res.status(201).json({ id: expenseId });
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  });

  app.delete("/api/groups/:id/expenses/:expenseId", (req, res) => {
    const result = db
      .prepare("DELETE FROM expenses WHERE id = ? AND group_id = ?")
      .run(Number(req.params.expenseId), Number(req.params.id));
    if (result.changes === 0) return res.status(404).json({ error: "expense not found" });
    res.status(204).end();
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ") });
    }
    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({ error: "invalid JSON" });
    }
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  });

  return app;
}
