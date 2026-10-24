import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { openDb } from "../src/db.js";

describe("expense splitter API", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp(openDb(":memory:"));
  });

  async function setupGroup() {
    const group = await request(app).post("/api/groups").send({ name: "Trip" }).expect(201);
    const id = group.body.id as number;
    const ana = await request(app).post(`/api/groups/${id}/members`).send({ name: "Ana" }).expect(201);
    const ben = await request(app).post(`/api/groups/${id}/members`).send({ name: "Ben" }).expect(201);
    const cy = await request(app).post(`/api/groups/${id}/members`).send({ name: "Cy" }).expect(201);
    return { id, ana: ana.body.id as number, ben: ben.body.id as number, cy: cy.body.id as number };
  }

  it("creates a group and returns it with no members, expenses, or settlements", async () => {
    const res = await request(app).post("/api/groups").send({ name: "Roommates" }).expect(201);
    const group = await request(app).get(`/api/groups/${res.body.id}`).expect(200);
    expect(group.body).toMatchObject({ name: "Roommates", members: [], expenses: [], settlements: [] });
  });

  it("splits an expense equally and computes who pays whom", async () => {
    const { id, ana, ben, cy } = await setupGroup();

    await request(app)
      .post(`/api/groups/${id}/expenses`)
      .send({ description: "Dinner", amount: "30.00", paidBy: ana, participantIds: [ana, ben, cy] })
      .expect(201);

    const group = await request(app).get(`/api/groups/${id}`).expect(200);
    const balance = (memberId: number) =>
      group.body.balances.find((b: { memberId: number }) => b.memberId === memberId).balanceCents;

    expect(balance(ana)).toBe(2000);
    expect(balance(ben)).toBe(-1000);
    expect(balance(cy)).toBe(-1000);
    expect(group.body.settlements).toHaveLength(2);
    expect(group.body.settlements.reduce((sum: number, s: { amountCents: number }) => sum + s.amountCents, 0)).toBe(2000);
  });

  it("parses amounts without float drift", async () => {
    const { id, ana, ben } = await setupGroup();
    await request(app)
      .post(`/api/groups/${id}/expenses`)
      .send({ description: "Snacks", amount: "0.30", paidBy: ana, participantIds: [ana, ben] })
      .expect(201);
    const group = await request(app).get(`/api/groups/${id}`).expect(200);
    expect(group.body.expenses[0].amountCents).toBe(30);
  });

  it("rejects a payer or participant who is not in the group", async () => {
    const { id, ana } = await setupGroup();
    const other = await request(app).post("/api/groups").send({ name: "Other" }).expect(201);
    const outsider = await request(app).post(`/api/groups/${other.body.id}/members`).send({ name: "Zed" }).expect(201);

    await request(app)
      .post(`/api/groups/${id}/expenses`)
      .send({ description: "Oops", amount: "5", paidBy: outsider.body.id, participantIds: [ana] })
      .expect(400);
    await request(app)
      .post(`/api/groups/${id}/expenses`)
      .send({ description: "Oops", amount: "5", paidBy: ana, participantIds: [outsider.body.id] })
      .expect(400);
  });

  it("rejects invalid amounts and empty descriptions", async () => {
    const { id, ana } = await setupGroup();
    await request(app)
      .post(`/api/groups/${id}/expenses`)
      .send({ description: "Free", amount: "0", paidBy: ana, participantIds: [ana] })
      .expect(400);
    await request(app)
      .post(`/api/groups/${id}/expenses`)
      .send({ description: "  ", amount: "5", paidBy: ana, participantIds: [ana] })
      .expect(400);
    await request(app)
      .post(`/api/groups/${id}/expenses`)
      .send({ description: "Bad", amount: "1.234", paidBy: ana, participantIds: [ana] })
      .expect(400);
  });

  it("deletes an expense and updates the balances", async () => {
    const { id, ana, ben } = await setupGroup();
    const expense = await request(app)
      .post(`/api/groups/${id}/expenses`)
      .send({ description: "Tickets", amount: "20", paidBy: ana, participantIds: [ana, ben] })
      .expect(201);

    await request(app).delete(`/api/groups/${id}/expenses/${expense.body.id}`).expect(204);

    const group = await request(app).get(`/api/groups/${id}`).expect(200);
    expect(group.body.expenses).toEqual([]);
    expect(group.body.settlements).toEqual([]);
  });

  it("returns 404 for an unknown group", async () => {
    await request(app).get("/api/groups/9999").expect(404);
  });
});
