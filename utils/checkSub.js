const db = require('../db');

exports.checkSubscription = (req, res, next) => {
  const { userId, groupId } = req.body;

  db.get(
    'SELECT * FROM user_groups WHERE user_id = ? AND group_id = ?',
    [userId, groupId],
    (err, row) => {
      if (err) {
        return next(err);
      }
      if (!row) {
        return res.status(403).send('User not subscribed to this group');
      }
      next();
    }
  );
};
