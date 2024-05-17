const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
dotenv.config();

const db = new sqlite3.Database('./mydatabase.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON');
      db.run('BEGIN TRANSACTION');
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
      )`, (err) => {
        if (err) console.error('Error creating users table', err.message);
      });
      db.run(`CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        owner_id INTEGER,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )`, (err) => {
        if (err) console.error('Error creating groups table', err.message);
      });
      db.run(`CREATE TABLE IF NOT EXISTS user_groups (
        user_id INTEGER,
        group_id INTEGER,
        PRIMARY KEY (user_id, group_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (group_id) REFERENCES groups(id)
      )`, (err) => {
        if (err) console.error('Error creating user_groups table', err.message);
      });
      db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        group_id INTEGER,
        content TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (group_id) REFERENCES groups(id)
      )`, (err) => {
        if (err) console.error('Error creating messages table', err.message);
      });
      db.run('COMMIT', (err) => {
        if (err) console.error('Error committing transaction', err.message);
      });
});
}
});


module.exports = db;