import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345678",
  database: "auraLearn"
});

db.connect((err) => {
  if (err) {
    console.log("MySQL Connection Failed ❌", err);
    return;
  }
  console.log("MySQL Connected Successfully! ✅");
});

export default db;
