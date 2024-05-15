// index.js
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');
const { body, param, validationResult } = require('express-validator');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

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
  res.send(`
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: #f0f0f0;
      }
      h1 {
        color: #333;
      }
      ul {
        list-style-type: none;
        padding: 0;
      }
      li {
        margin: 10px 0;
      }
      a {
        text-decoration: none;
        color: #007BFF;
      }
      a:hover {
        text-decoration: underline;
      }
    </style>
    <h1>Gruppexamination - SQL bulletin</h1>
    <ul>
      <li><a href="/signup">Signup</a></li>
      <li><a href="/users/:id">Read User by ID</a></li>
      <li><a href="/users/:id">Update User</a></li>
      <li><a href="/users/:id">Delete User</a></li>
      <li><a href="/groups">Read All Groups</a></li>
      <li><a href="/groups/:id">Read Group by ID</a></li>
      <li><a href="/groups">Create Group</a></li>
      <li><a href="/groups/:id">Update Group</a></li>
      <li><a href="/groups/:id">Delete Group</a></li>
      <li><a href="/messages">Read All Messages</a></li>
      <li><a href="/messages/:id">Read Message by ID</a></li>
      <li><a href="/messages">Create Message</a></li>
      <li><a href="/messages/:id">Update Message</a></li>
      <li><a href="/messages/:id">Delete Message</a></li>
      <li><a href="/groups/subscribe">Subscribe to Group</a></li>
      <li><a href="/groups/unsubscribe">Unsubscribe from Group</a></li>
    </ul>
  `);
});

// Create a new user (signup)
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
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({ error: 'Username already exists' });
        }
        return next(err);
      }
      res.status(201).send('User created successfully');
    });
  } catch (err) {
    next(err);
  }
});


// Read a user by ID
app.get('/users/:id', [param('id').isInt()], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.params.id;
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.status(200).json(user);
  });
});

// Update a user
app.put('/users/:id', [
  param('id').isInt(),
  body('username').optional().isString().trim().notEmpty(),
  body('password').optional().isString().trim().isLength({ min: 6 })
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.params.id;
  const { username, password } = req.body;
  let updates = [];
  let params = [];

  if (username) {
    updates.push('username = ?');
    params.push(username);
  }
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updates.push('password = ?');
    params.push(hashedPassword);
  }

  if (updates.length === 0) {
    return res.status(400).send('No updates provided');
  }

  params.push(userId);

  db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) {
      return next(err);
    }
    if (this.changes === 0) {
      return res.status(404).send('User not found');
    }
    res.status(200).send('User updated successfully');
  });
});

// Delete a user
app.delete('/users/:id', [param('id').isInt()], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.params.id;
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) {
      return next(err);
    }
    if (this.changes === 0) {
      return res.status(404).send('User not found');
    }
    res.status(200).send('User deleted successfully');
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

  // Check if the owner exists
  db.get('SELECT * FROM users WHERE id = ?', [ownerId], (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(404).send('Owner not found');
    }

    db.run('INSERT INTO groups (name, owner_id) VALUES (?, ?)', [name, ownerId], function(err) {
      if (err) {
        return next(err);
      }
      res.status(201).send('Group created successfully');
    });
  });
});

// Read all groups
app.get('/groups', (req, res, next) => {
  db.all('SELECT * FROM groups', (err, groups) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(groups);
  });
});

// Read a group by ID
app.get('/groups/:id', [param('id').isInt()], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const groupId = req.params.id;
  db.get('SELECT * FROM groups WHERE id = ?', [groupId], (err, group) => {
    if (err) {
      return next(err);
    }
    if (!group) {
      return res.status(404).send('Group not found');
    }
    res.status(200).json(group);
  });
});

// Update a group
app.put('/groups/:id', [
  param('id').isInt(),
  body('name').optional().isString().trim().notEmpty(),
  body('ownerId').optional().isInt()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const groupId = req.params.id;
  const { name, ownerId } = req.body;
  let updates = [];
  let params = [];

  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  if (ownerId) {
    updates.push('owner_id = ?');
    params.push(ownerId);
  }

  if (updates.length === 0) {
    return res.status(400).send('No updates provided');
  }

  params.push(groupId);

  db.run(`UPDATE groups SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) {
      return next(err);
    }
    if (this.changes === 0) {
      return res.status(404).send('Group not found');
    }
    res.status(200).send('Group updated successfully');
  });
});

// Delete a group
app.delete('/groups/:id', [param('id').isInt()], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const groupId = req.params.id;
  db.run('DELETE FROM groups WHERE id = ?', [groupId], function(err) {
    if (err) {
      return next(err);
    }
    if (this.changes === 0) {
      return res.status(404).send('Group not found');
    }
    res.status(200).send('Group deleted successfully');
  });
});

// Create a new message
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

// Read all messages
app.get('/messages', (req, res, next) => {
  db.all('SELECT * FROM messages', (err, messages) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(messages);
  });
});

// Read a message by ID
app.get('/messages/:id', [param('id').isInt()], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const messageId = req.params.id;
  db.get('SELECT * FROM messages WHERE id = ?', [messageId], (err, message) => {
    if (err) {
      return next(err);
    }
    if (!message) {
      return res.status(404).send('Message not found');
    }
    res.status(200).json(message);
  });
});

// Update a message
app.put('/messages/:id', [
  param('id').isInt(),
  body('content').optional().isString().trim().notEmpty()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const messageId = req.params.id;
  const { content } = req.body;
  let updates = [];
  let params = [];

  if (content) {
    updates.push('content = ?');
    params.push(content);
  }

  if (updates.length === 0) {
    return res.status(400).send('No updates provided');
  }

  params.push(messageId);

  db.run(`UPDATE messages SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) {
      return next(err);
    }
    if (this.changes === 0) {
      return res.status(404).send('Message not found');
    }
    res.status(200).send('Message updated successfully');
  });
});

// Delete a message
app.delete('/messages/:id', [param('id').isInt()], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const messageId = req.params.id;
  db.run('DELETE FROM messages WHERE id = ?', [messageId], function(err) {
    if (err) {
      return next(err);
    }
    if (this.changes === 0) {
      return res.status(404).send('Message not found');
    }
    res.status(200).send('Message deleted successfully');
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

  // Check if the user and group exist
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(404).send('User not found');
    }

    db.get('SELECT * FROM groups WHERE id = ?', [groupId], (err, group) => {
      if (err) {
        return next(err);
      }
      if (!group) {
        return res.status(404).send('Group not found');
      }

      db.run('INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)', [userId, groupId], function(err) {
        if (err) {
          return next(err);
        }
        res.status(200).send('Subscribed to group successfully');
      });
    });
  });
});

// Unsubscribe from a group (channel)
app.delete('/groups/unsubscribe', [
  body('userId').isInt(),
  body('groupId').isInt()
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, groupId } = req.body;

  // Check if the subscription exists
  db.get('SELECT * FROM user_groups WHERE user_id = ? AND group_id = ?', [userId, groupId], (err, subscription) => {
    if (err) {
      return next(err);
    }
    if (!subscription) {
      return res.status(404).send('Subscription not found');
    }

    db.run('DELETE FROM user_groups WHERE user_id = ? AND group_id = ?', [userId, groupId], function(err) {
      if (err) {
        return next(err);
      }
      if (this.changes === 0) {
        return res.status(404).send('Subscription not found');
      }
      res.status(200).send('Unsubscribed from group successfully');
    });
  });
});

// Listen on the specified port
app.listen(port, () => {
  const localURL = `http://localhost:${port}`;
  console.log(`Server is running and listening on port ${port}`);
  console.log(`Open your browser and navigate to: ${localURL}`);
});