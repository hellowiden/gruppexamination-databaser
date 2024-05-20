const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messagesController');
const { body, param } = require('express-validator');

//* GET ALL MESSAGES
router.get('/', messagesController.getAllMessages)
//* GET MESSAGES BY ID
router.get('/:id', [param('id').isInt()], messagesController.getMessageById);
//* POST MESSAGE
router.post('/',  body('userId').isInt(),
  body('channelId').isInt(),
  body('content').isString().trim().notEmpty(), messagesController.createMessage);
//* PUT MESSAGES BY ID
router.put(
  '/:id',
  param('id').isInt(),
  body('content').optional().isString().trim().notEmpty(),
  messagesController.updateMessageById
);
//* DELETE MESSEGES BY ID
router.delete('/:id', [param('id').isInt()], messagesController.deleteMessage);

module.exports = router;