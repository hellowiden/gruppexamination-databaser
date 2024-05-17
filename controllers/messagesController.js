const { body, param, validationResult } = require('express-validator');
const db = require('../db');

//* Read all messages
exports.getAllMessages = (req, res, next) => {
  db.all('SELECT * FROM messages', (err, messages) => {
    if (err) {
      return next(err);
    }
    res.status(200).json(messages);
  });
};