const { body, param, validationResult } = require('express-validator');
const db = require('../db');

//* Create a group (channel) with an owner
exports.createGroup = [
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
        'INSERT INTO groups (name, owner_id) VALUES (?, ?)',
        [name, ownerId],
        function (err) {
          if (err) {
            return next(err);
          }
          res.status(201).send('Group created successfully');
        }
      );
    });
  },
];

//* Read all groups
exports.getAllGroups = (req, res, next) => {
  db.all('SELECT * FROM groups', (err, groups) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(groups);
  });
};

//* Read a group by ID
exports.getGroupById = [
  param('id').isInt(),
  (req, res, next) => {
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
  },
];

//* Update a group
exports.updateGroup = [
  param('id').isInt(),
  body('name').optional().isString().trim().notEmpty(),
  body('ownerId').optional().isInt(),
  (req, res, next) => {
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

    db.run(
      `UPDATE groups SET ${updates.join(', ')} WHERE id = ?`,
      params,
      function (err) {
        if (err) {
          return next(err);
        }
        if (this.changes === 0) {
          return res.status(404).send('Group not found');
        }
        res.status(200).send('Group updated successfully');
      }
    );
  },
];

//* Delete a group
exports.deleteGroup = [
  param('id').isInt(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const groupId = req.params.id;
    db.run('DELETE FROM groups WHERE id = ?', [groupId], function (err) {
      if (err) {
        return next(err);
      }
      if (this.changes === 0) {
        return res.status(404).send('Group not found');
      }
      res.status(200).send('Group deleted successfully');
    });
  },
];

//* Subscribe to a group (channel)
exports.subscribeGroup = [
  body('userId').isInt(),
  body('groupId').isInt(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, groupId } = req.body;

    // Check if the user exists
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(404).send('User not found');
      }

      // Check if the group exists
      db.get('SELECT * FROM groups WHERE id = ?', [groupId], (err, group) => {
        if (err) {
          return next(err);
        }
        if (!group) {
          return res.status(404).send('Group not found');
        }

        db.run(
          'INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)',
          [userId, groupId],
          function (err) {
            if (err) {
              return next(err);
            }
            res.status(200).send('Subscribed to group successfully');
          }
        );
      });
    });
  },
];

// Unsubscribe from a group (channel)
// exports.unsubscribeGroup = [
//   body('userId').isInt(),
//   body('groupId').isInt(),
//   async (req, res, next) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { userId, groupId } = req.body;

//     try {
//       // Check if the subscription exists
//       const subscription = await new Promise((resolve, reject) => {
//         db.get(
//           'SELECT * FROM user_groups WHERE user_id = ? AND group_id = ?',
//           [userId, groupId],
//           (err, row) => {
//             if (err) {
//               reject(err);
//             } else {
//               resolve(row);
//             }
//           }
//         );
//       });

//       if (!subscription) {
//         return res.status(404).send('Subscription not found');
//       }

//       // Delete the subscription
//       const result = await new Promise((resolve, reject) => {
//         db.run(
//           'DELETE FROM user_groups WHERE user_id = ? AND group_id = ?',
//           [userId, groupId],
//           function (err) {
//             if (err) {
//               reject(err);
//             } else {
//               resolve(this.changes);
//             }
//           }
//         );
//       });

//       if (result === 0) {
//         return res.status(404).send('Subscription not found');
//       }

//       res.status(200).send('Unsubscribed from group successfully');
//     } catch (err) {
//       next(err);
//     }
//   },
// ];