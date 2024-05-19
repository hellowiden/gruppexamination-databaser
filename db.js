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
      db.run(`CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        owner_id INTEGER,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )`, (err) => {
        if (err) console.error('Error creating channelss table', err.message);
      });
      db.run(
        `CREATE TABLE IF NOT EXISTS user_channels (
        user_id INTEGER,
        channel_id INTEGER,
        PRIMARY KEY (user_id, channel_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (channel_id) REFERENCES channels(id)
      )`,
        (err) => {
          if (err)
            console.error('Error creating user_channels table', err.message);
        }
      );
      db.run(
        `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        channel_id INTEGER,
        content TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (channel_id) REFERENCES channels(id)
      )`,
        (err) => {
          if (err) console.error('Error creating messages table', err.message);
        }
      );
      db.run('COMMIT', (err) => {
        if (err) console.error('Error committing transaction', err.message);
      });
});
}
});


module.exports = db;