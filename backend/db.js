const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(
  process.env.ADS_DB_FILE || path.join(__dirname, "data.db")
);
const db = new sqlite3.Database(dbPath);

// kreiraj tabelu ako ne postoji
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      imageUrl TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
});

module.exports = db;
