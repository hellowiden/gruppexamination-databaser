require('dotenv').config(); 

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

// Create a group (channel) with an owner
app.post('/groups', [
  body('name').isString().trim().notEmpty(),
  body('ownerId').isInt()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, ownerId } = req.body;
  db.run('INSERT INTO groups (name, owner_id) VALUES (?, ?)', [name, ownerId], function(err) {
    if (err) {
      return next(err);
    }
    res.status(201).send('Group created successfully');
  });
});

// Subscribe to a group (channel)
app.post('/groups/subscribe', [
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
    res.status(200).send('Subscribed to group successfully');
  });
});

// Post a message to a group (channel)
app.post('/messages', [
  body('userId').isInt(),
  body('groupId').isInt(),
  body('content').isString().trim().notEmpty()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, groupId, content } = req.body;

  // Check if user is subscribed to the group
  db.get('SELECT * FROM user_groups WHERE user_id = ? AND group_id = ?', [userId, groupId], (err, row) => {
    if (err) {
      return next(err);
    }
    if (!row) {
      return res.status(403).send('User not subscribed to this group');
    }

    db.run('INSERT INTO messages (user_id, group_id, content) VALUES (?, ?, ?)', [userId, groupId, content], function(err) {
      if (err) {
        return next(err);
      }
      res.status(201).send('Message posted successfully');
    });
  });
});

// Read all messages for a group (channel)
app.get('/groups/:groupId/messages', [param('groupId').isInt()], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const groupId = req.params.groupId;
  db.all('SELECT * FROM messages WHERE group_id = ?', [groupId], (err, messages) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(messages);
  });
});

// Listen on the specified port
app.listen(port, () => {
  console.log(`Server is running and listening on port ${port}`);
});
