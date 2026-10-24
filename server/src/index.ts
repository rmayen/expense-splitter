import { createApp } from "./app.js";
import { openDb } from "./db.js";

const port = Number(process.env.PORT ?? 3002);
const db = openDb(process.env.DB_PATH ?? "expense-splitter.db");

createApp(db).listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
