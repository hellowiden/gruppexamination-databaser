const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const usersRoutes = require('./routes/usersRoutes');
const channelsRoutes = require('./routes/channelsRoutes');
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
    </style>
    <h1>Gruppexamination - SQL bulletin</h1>
  `);
});

//! ----------- Kvar att flytta ------------

//* Delete unsubscribe
app.delete(
  '/channels/unsubscribe',
  [body('userId').isInt(), body('channelId').isInt()],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, channelId } = req.body;

    // Check if the subscription exists
    db.get(
      'SELECT * FROM user_channels WHERE user_id = ? AND channel_id = ?',
      [userId, channelId],
      (err, subscription) => {
        if (err) {
          return next(err);
        }
        if (!subscription) {
          return res.status(404).send('Subscription not found');
        }

        db.run(
          'DELETE FROM user_channels WHERE user_id = ? AND channel_id = ?',
          [userId, channelId],
          function (err) {
            if (err) {
              return next(err);
            }
            if (this.changes === 0) {
              return res.status(404).send('Subscription not found');
            }
            res.status(200).send('Unsubscribed from channel successfully');
          }
        );
      }
    );
  }
);

//! -----------------------

// Other routes
app.use('/users', usersRoutes);
app.use('/channels', channelsRoutes);
app.use('/messages', messagesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});