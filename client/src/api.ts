export type Member = { id: number; name: string };

export type Expense = {
  id: number;
  description: string;
  amountCents: number;
  paidBy: number;
  participantIds: number[];
  createdAt: string;
};

export type Group = {
  id: number;
  name: string;
  members: Member[];
  expenses: Expense[];
  balances: { memberId: number; balanceCents: number }[];
  settlements: { from: number; to: number; amountCents: number }[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  createGroup: (name: string) =>
    request<{ id: number; name: string }>("/api/groups", { method: "POST", body: JSON.stringify({ name }) }),
  getGroup: (id: number) => request<Group>(`/api/groups/${id}`),
  addMember: (groupId: number, name: string) =>
    request<Member>(`/api/groups/${groupId}/members`, { method: "POST", body: JSON.stringify({ name }) }),
  addExpense: (
    groupId: number,
    body: { description: string; amount: string; paidBy: number; participantIds: number[] },
  ) => request<{ id: number }>(`/api/groups/${groupId}/expenses`, { method: "POST", body: JSON.stringify(body) }),
  deleteExpense: (groupId: number, expenseId: number) =>
    request<void>(`/api/groups/${groupId}/expenses/${expenseId}`, { method: "DELETE" }),
};
