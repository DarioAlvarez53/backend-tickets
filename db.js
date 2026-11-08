const {DatabaseSync} = require("node:sqlite")

// Creando la nueva tabla
const db = new DatabaseSync("tickets.db")

db.prepare(`
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        estado TEXT NOT NULL,
        prioridad TEXT NOT NULL,
        fecha TEXT
    )    
`).run();

module.exports = db;