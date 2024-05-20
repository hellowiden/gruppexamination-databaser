const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { body, param, validationResult } = require('express-validator');

// POST SIGNUP
router.post('/signup', usersController.handleSignup);
// POST LOGIN
router.post('/login', usersController.handleLogin);
// GET USER ID
router.get('/:id', [param('id').isInt()], usersController.getUserById);
// PUT USER BY ID
router.put('/:id', [param('id').isInt()], usersController.updateUserById);
// DELETE USER BY ID
router.delete(
  '/:id',
  [param('id').isInt()],
  usersController.deleteUserById
);

module.exports = router;
