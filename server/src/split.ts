// Pure settlement logic, kept free of HTTP and database code so it can be tested directly.

export type Share = { memberId: number; shareCents: number };

export type Expense = {
  paidBy: number;
  amountCents: number;
  shares: Share[];
};

export type Transfer = { from: number; to: number; amountCents: number };

// Splits an amount evenly across participants. Any leftover cents go to the first
// participants so the shares always add up to the full amount.
export function splitEqually(amountCents: number, memberIds: number[]): Share[] {
  if (memberIds.length === 0) throw new Error("at least one participant is required");
  const base = Math.floor(amountCents / memberIds.length);
  const remainder = amountCents - base * memberIds.length;
  return memberIds.map((memberId, i) => ({
    memberId,
    shareCents: base + (i < remainder ? 1 : 0),
  }));
}

// Net position per member: positive means they are owed money, negative means they owe.
export function computeBalances(memberIds: number[], expenses: Expense[]): Map<number, number> {
  const balances = new Map(memberIds.map((id) => [id, 0]));
  for (const expense of expenses) {
    balances.set(expense.paidBy, (balances.get(expense.paidBy) ?? 0) + expense.amountCents);
    for (const share of expense.shares) {
      balances.set(share.memberId, (balances.get(share.memberId) ?? 0) - share.shareCents);
    }
  }
  return balances;
}

// Greedy settlement: match the largest remaining debtor with the largest remaining creditor.
// Each step clears at least one person, so the result has at most n - 1 transfers.
export function settle(balances: Map<number, number>): Transfer[] {
  const creditors: [number, number][] = [];
  const debtors: [number, number][] = [];
  for (const [memberId, balance] of balances) {
    if (balance > 0) creditors.push([memberId, balance]);
    else if (balance < 0) debtors.push([memberId, -balance]);
  }
  const byAmountDesc = (a: [number, number], b: [number, number]) => b[1] - a[1];
  creditors.sort(byAmountDesc);
  debtors.sort(byAmountDesc);

  const transfers: Transfer[] = [];
  let c = 0;
  let d = 0;
  while (c < creditors.length && d < debtors.length) {
    const amountCents = Math.min(creditors[c][1], debtors[d][1]);
    transfers.push({ from: debtors[d][0], to: creditors[c][0], amountCents });
    creditors[c][1] -= amountCents;
    debtors[d][1] -= amountCents;
    if (creditors[c][1] === 0) c++;
    if (debtors[d][1] === 0) d++;
  }
  return transfers;
}
