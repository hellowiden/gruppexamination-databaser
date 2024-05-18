const bcrypt = require('bcrypt');
const db = require('../db');
const { validationResult } = require('express-validator');

//* Create a new user (signup)
exports.handleSignup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword],
      function (err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: 'Username already exists' });
          }
          return next(err);
        }
        res.status(201).send('User created successfully');
      }
    );
  } catch (err) {
    next(err);
  }
};

//* Login a user (login)
exports.handleLogin = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      res.status(200).json({ message: 'Login successful' });
    }
  );
};

//* Read a user by ID
exports.getUserById = (req, res, next) => {
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
};

//* Update a user
exports.updateUserById = async (req, res, next) => {
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

  db.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function (err) {
      if (err) {
        return next(err);
      }
      if (this.changes === 0) {
        return res.status(404).send('User not found');
      }
      res.status(200).send('User updated successfully');
    }
  );
};

//* Delete a user
exports.deleteUserById = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.params.id;
  db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
    if (err) {
      return next(err);
    }
    if (this.changes === 0) {
      return res.status(404).send('User not found');
    }
    res.status(200).send('User deleted successfully');
  });
};