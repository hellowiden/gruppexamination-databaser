const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
const port = 3000;

app.use(express.json());

// Root URL
app.get('/', (req, res) => {
  res.send('Welcome to the homepage');
});

// User signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
      if (err) {
        res.status(500).send('Error creating user');
      } else {
        res.status(201).send('User created successfully');
      }
    });
  } catch (err) {
    res.status(500).send('Error creating user');
  }
});

// User login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      res.status(500).send('Error logging in');
    } else if (user && await bcrypt.compare(password, user.password)) {
      res.status(200).send('Login successful');
    } else {
      res.status(401).send('Invalid username or password');
    }
  });
});

// Create a group
app.post('/groups', (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO groups (name) VALUES (?)', [name], function(err) {
    if (err) {
      res.status(500).send('Error creating group');
    } else {
      res.status(201).send('Group created successfully');
    }
  });
});

// Join a group
app.post('/groups/join', (req, res) => {
  const { userId, groupId } = req.body;
  db.run('INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)', [userId, groupId], function(err) {
    if (err) {
      res.status(500).send('Error joining group');
    } else {
      res.status(200).send('Joined group successfully');
    }
  });
});

// Create a note
app.post('/notes', (req, res) => {
  const { userId, title, content } = req.body;
  db.run('INSERT INTO notes (userId, title, content) VALUES (?, ?, ?)', [userId, title, content], function(err) {
    if (err) {
      res.status(500).send('Error creating note');
    } else {
      res.status(201).send('Note created successfully');
    }
  });
});

// Read all notes for a user
app.get('/notes/:userId', (req, res) => {
  const userId = req.params.userId;
  db.all('SELECT * FROM notes WHERE userId = ?', [userId], (err, notes) => {
    if (err) {
      res.status(500).send('Error fetching notes');
    } else {
      res.status(200).json(notes);
    }
  });
});

// Update a note
app.put('/notes/:noteId', (req, res) => {
  const noteId = req.params.noteId;
  const { title, content } = req.body;
  db.run('UPDATE notes SET title = ?, content = ? WHERE id = ?', [title, content, noteId], function(err) {
    if (err) {
      res.status(500).send('Error updating note');
    } else {
      res.status(200).send('Note updated successfully');
    }
  });
});

// Delete a note
app.delete('/notes/:noteId', (req, res) => {
  const noteId = req.params.noteId;
  db.run('DELETE FROM notes WHERE id = ?', [noteId], function(err) {
    if (err) {
      res.status(500).send('Error deleting note');
    } else {
      res.status(200).send('Note deleted successfully');
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running and listening on port ${port}`);
});
