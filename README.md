# Expense Splitter

A shared expense splitter for groups such as trips, roommates, or dinners. Add people, log what was paid, and the app works out who owes whom, using the fewest payments needed to settle up.

## Features

- Create a group and add people to it
- Log an expense with a payer and any subset of the group as participants
- Equal splits that never lose a cent (leftover cents go to the first participants)
- Live balances for every person
- A "settle up" list that clears every balance with at most `n - 1` payments
- Delete an expense and balances update immediately

## Tech stack

- **Client:** React, TypeScript, Vite
- **Server:** Express 5, TypeScript, Zod validation
- **Storage:** SQLite via Node's built-in `node:sqlite`
- **Tests:** Vitest and Supertest, run in CI on every push

## Design notes

- **Money is stored as integer cents.** Amounts are parsed from strings like `"24.50"` without floating-point rounding.
- **Settlement logic is pure.** `server/src/split.ts` has no HTTP or database code, so it is tested directly.
- **No login.** Groups are addressed by an id in the URL. Anyone with the link can view and edit the group. This keeps the scope small; adding accounts would be the next step for real use.

## Running locally

Requires Node 22.13 or newer.

```bash
npm install
npm run dev:server   # API on http://localhost:3002
npm run dev:client   # app on http://localhost:5174
```

## Tests

```bash
npm test
```

## Project layout

```
server/
  src/split.ts   settlement and balance logic
  src/app.ts     Express routes and validation
  src/db.ts      SQLite schema
  test/          unit and API tests
client/
  src/App.tsx          routing and group creation
  src/GroupPage.tsx    balances, settle-up list, expenses
  src/api.ts           API client
```
