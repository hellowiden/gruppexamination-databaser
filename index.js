require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');
const { body, param, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Input validation middleware for signup and login
const validateUserInput = [
  body('username').isString().trim().notEmpty(),
  body('password').isString().trim().isLength({ min: 6 })
];

// Root URL
app.get('/', (req, res) => {
  res.send('Welcome to the homepage');
});

// User signup
app.post('/signup', validateUserInput, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
      if (err) {
        return next(err);
      }
      res.status(201).send('User created successfully');
    });
  } catch (err) {
    next(err);
  }
});

// User login
app.post('/login', validateUserInput, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return next(err);
    }
    if (user && await bcrypt.compare(password, user.password)) {
      res.status(200).send('Login successful');
    } else {
      res.status(401).send('Invalid username or password');
    }
  });
});

// Create a group
app.post('/groups', [body('name').isString().trim().notEmpty()], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name } = req.body;
  db.run('INSERT INTO groups (name) VALUES (?)', [name], function(err) {
    if (err) {
      return next(err);
    }
    res.status(201).send('Group created successfully');
  });
});

// Join a group
app.post('/groups/join', [
  body('userId').isInt(),
  body('groupId').isInt()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, groupId } = req.body;
  db.run('INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)', [userId, groupId], function(err) {
    if (err) {
      return next(err);
    }
    res.status(200).send('Joined group successfully');
  });
});

// Create a note
app.post('/notes', [
  body('userId').isInt(),
  body('title').isString().trim().notEmpty(),
  body('content').isString().trim().notEmpty()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, title, content } = req.body;
  db.run('INSERT INTO notes (userId, title, content) VALUES (?, ?, ?)', [userId, title, content], function(err) {
    if (err) {
      return next(err);
    }
    res.status(201).send('Note created successfully');
  });
});

// Read all notes for a user
app.get('/notes/:userId', [param('userId').isInt()], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.params.userId;
  db.all('SELECT * FROM notes WHERE userId = ?', [userId], (err, notes) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(notes);
  });
});

// Update a note
app.put('/notes/:noteId', [
  param('noteId').isInt(),
  body('title').isString().trim().notEmpty(),
  body('content').isString().trim().notEmpty()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const noteId = req.params.noteId;
  const { title, content } = req.body;
  db.run('UPDATE notes SET title = ?, content = ? WHERE id = ?', [title, content, noteId], function(err) {
    if (err) {
      return next(err);
    }
    res.status(200).send('Note updated successfully');
  });
});

// Delete a note
app.delete('/notes/:noteId', [param('noteId').isInt()], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const noteId = req.params.noteId;
  db.run('DELETE FROM notes WHERE id = ?', [noteId], function(err) {
    if (err) {
      return next(err);
    }
    res.status(200).send('Note deleted successfully');
  });
});

app.listen(port, () => {
  console.log(`Server is running and listening on port ${port}`);
});
