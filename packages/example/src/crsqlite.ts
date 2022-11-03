import sqliteWasm from "crsqlite-wasm-esm";

const sqlite = await sqliteWasm();

const db = new sqlite.oo1.DB(":memory:");

db.exec([
  "CREATE TABLE foo (a primary key, b);",
  "INSERT INTO foo VALUES (1, 2);",
]);

let rows = [];
db.exec({
  sql: "SELECT * FROM foo",
  resultRows: rows,
  rowMode: "object",
});
console.log(rows);
