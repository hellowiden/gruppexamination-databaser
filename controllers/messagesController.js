const { validationResult } = require('express-validator');
const db = require('../db');


//* Create a new message
exports.createMessage = (req, res, next) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, channelId, content } = req.body;

  // Check if user is subscribed to the channel
  db.get(
    'SELECT * FROM user_channels WHERE user_id = ? AND channel_id = ?',
    [userId, channelId],
    (err, row) => {
      if (err) {
        return next(err);
      }
      if (!row) {
        return res.status(403).send('User not subscribed to this channel');
      }

      // User is subscribed, create the message
      db.run(
        'INSERT INTO messages (user_id, channel_id, content) VALUES (?, ?, ?)',
        [userId, channelId, content],
        function (err) {
          if (err) {
            return next(err);
          }
          res.status(201).send('Message posted successfully');
        }
      );
    }
  );
};

//* Read all messages
exports.getAllMessages = (req, res, next) => {
  db.all('SELECT * FROM messages', (err, messages) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(messages);
  });
};

//* Read a message by ID
exports.getMessageById = (req, res, next) => {
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
};

//* Update a message
exports.updateMessageById = (req, res, next) => {
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
};

//* Delete a message
exports.deleteMessage = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const messageId = req.params.id;
    db.run('DELETE FROM messages WHERE id = ?', [messageId], function (err) {
      if (err) {
        return next(err);
      }
      if (this.changes === 0) {
        return res.status(404).send('Message not found');
      }
      res.status(200).send('Message deleted successfully');
    });
  }

