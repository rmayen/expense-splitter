import { describe, expect, it } from "vitest";
import { computeBalances, settle, splitEqually } from "../src/split.js";

describe("splitEqually", () => {
  it("gives leftover cents to the first participants so the total is exact", () => {
    const shares = splitEqually(1000, [1, 2, 3]);
    expect(shares.map((s) => s.shareCents)).toEqual([334, 333, 333]);
    expect(shares.reduce((sum, s) => sum + s.shareCents, 0)).toBe(1000);
  });

  it("rejects an empty participant list", () => {
    expect(() => splitEqually(500, [])).toThrow();
  });
});

describe("computeBalances", () => {
  it("nets what each person paid against what they owe", () => {
    const balances = computeBalances([1, 2, 3], [
      { paidBy: 1, amountCents: 3000, shares: splitEqually(3000, [1, 2, 3]) },
      { paidBy: 2, amountCents: 600, shares: splitEqually(600, [2, 3]) },
    ]);
    expect(balances.get(1)).toBe(3000 - 1000);
    expect(balances.get(2)).toBe(-1000 + 600 - 300);
    expect(balances.get(3)).toBe(-1000 - 300);
  });
});

describe("settle", () => {
  it("settles a simple two-person debt with one payment", () => {
    const transfers = settle(new Map([[1, 500], [2, -500]]));
    expect(transfers).toEqual([{ from: 2, to: 1, amountCents: 500 }]);
  });

  it("returns no transfers when everyone is even", () => {
    expect(settle(new Map([[1, 0], [2, 0]]))).toEqual([]);
  });

  it("clears every balance with at most n - 1 payments", () => {
    const balances = new Map([[1, 4000], [2, -1500], [3, -1500], [4, -1000]]);
    const transfers = settle(balances);
    expect(transfers.length).toBeLessThanOrEqual(balances.size - 1);

    const remaining = new Map(balances);
    for (const t of transfers) {
      remaining.set(t.from, (remaining.get(t.from) ?? 0) + t.amountCents);
      remaining.set(t.to, (remaining.get(t.to) ?? 0) - t.amountCents);
    }
    for (const value of remaining.values()) expect(value).toBe(0);
  });
});
