const { body, param, validationResult } = require('express-validator');
const db = require('../db');

//* Create a channel with an owner
exports.createChannel = [
  body('name').isString().trim().notEmpty(),
  body('ownerId').isInt(),
  (req, res, next) => {
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

      db.run(
        'INSERT INTO channels (name, owner_id) VALUES (?, ?)',
        [name, ownerId],
        function (err) {
          if (err) {
            return next(err);
          }
          res.status(201).send('Channel created successfully');
        }
      );
    });
  },
];

//* Read all channels
exports.getAllChannels = (req, res, next) => {
  db.all('SELECT * FROM channels', (err, channels) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(channels);
  });
};

//* Read a channel by ID
exports.getChannelById = [
  param('id').isInt(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const channelId = req.params.id;
    db.get(
      'SELECT * FROM channels WHERE id = ?',
      [channelId],
      (err, channel) => {
        if (err) {
          return next(err);
        }
        if (!channel) {
          return res.status(404).send('Channel not found');
        }
        res.status(200).json(channel);
      }
    );
  },
];

//* Update a channel
exports.updateChannel = [
  param('id').isInt(),
  body('name').optional().isString().trim().notEmpty(),
  body('ownerId').optional().isInt(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const channelId = req.params.id;
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

    params.push(channelId);

    db.run(
      `UPDATE channels SET ${updates.join(', ')} WHERE id = ?`,
      params,
      function (err) {
        if (err) {
          return next(err);
        }
        if (this.changes === 0) {
          return res.status(404).send('Channel not found');
        }
        res.status(200).send('Channel updated successfully');
      }
    );
  },
];

//* Delete a channel
exports.deleteChannel = [
  param('id').isInt(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const channelId = req.params.id;
    db.run('DELETE FROM channels WHERE id = ?', [channelId], function (err) {
      if (err) {
        return next(err);
      }
      if (this.changes === 0) {
        return res.status(404).send('Channel not found');
      }
      res.status(200).send('Channel deleted successfully');
    });
  },
];

//* Subscribe to a channel
exports.subscribeChannel = [
  body('userId').isInt(),
  body('channelId').isInt(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, channelId } = req.body;

    // Check if the user exists
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(404).send('User not found');
      }

      // Check if the channel exists
      db.get(
        'SELECT * FROM channels WHERE id = ?',
        [channelId],
        (err, channel) => {
          if (err) {
            return next(err);
          }
          if (!channel) {
            return res.status(404).send('Channel not found');
          }

          db.run(
            'INSERT INTO user_channels (user_id, channel_id) VALUES (?, ?)',
            [userId, channelId],
            function (err) {
              if (err) {
                return next(err);
              }
              res.status(200).send('Subscribed to channel successfully');
            }
          );
        }
      );
    });
  },
];