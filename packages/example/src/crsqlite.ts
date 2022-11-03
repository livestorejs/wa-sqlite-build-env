import sqliteWasm from "crsqlite-wasm-esm";
import { Uuid } from "uuid-tool";

const sqlite = await sqliteWasm();

const db = new sqlite.oo1.DB(":memory:");

// @ts-ignore
window.db = db;
let rows = [];

db.exec("CREATE TABLE foo (a primary key, b);");
db.exec("INSERT INTO foo VALUES (1, 2);");
db.exec("select crsql_dbversion();", { resultRows: rows });
console.log("DB Version: ", rows[0][0]);
rows = [];
db.exec("select crsql_siteid();", { resultRows: rows });
console.log("Site ID: ", new Uuid(rows[0][0]).toString());

rows = [];
db.exec({
  sql: "SELECT * FROM foo",
  resultRows: rows,
  rowMode: "object",
});
console.log(rows[0]);
