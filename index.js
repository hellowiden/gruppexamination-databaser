const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const usersRoutes = require('./routes/usersRoutes');
const groupsRoutes = require('./routes/groupsRoutes');
const messagesRoutes = require('./routes/messagesRoutes');
const { body, validationResult } = require('express-validator');
const db = require('./db');

// Middleware
app.use(express.json());
app.use(cors());

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

//! ----------- Kvar att flytta ------------

//* Delete unsubscribe
app.delete(
  '/groups/unsubscribe',
  [body('userId').isInt(), body('groupId').isInt()],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, groupId } = req.body;

    // Check if the subscription exists
    db.get(
      'SELECT * FROM user_groups WHERE user_id = ? AND group_id = ?',
      [userId, groupId],
      (err, subscription) => {
        if (err) {
          return next(err);
        }
        if (!subscription) {
          return res.status(404).send('Subscription not found');
        }

        db.run(
          'DELETE FROM user_groups WHERE user_id = ? AND group_id = ?',
          [userId, groupId],
          function (err) {
            if (err) {
              return next(err);
            }
            if (this.changes === 0) {
              return res.status(404).send('Subscription not found');
            }
            res.status(200).send('Unsubscribed from group successfully');
          }
        );
      }
    );
  }
);

//! -----------------------

app.use('/users', usersRoutes);
app.use('/groups', groupsRoutes);
app.use('/messages', messagesRoutes);

app.listen(port, () => {
  console.log(`Server is running on port:${port}`);
});
