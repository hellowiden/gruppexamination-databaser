const express = require('express');
const router = express.Router();
const channelsController = require('../controllers/channelsController');
// const { body, param, validationResult } = require('express-validator');

// POST CHANNELS
router.post('/', channelsController.createChannel);
//GET ALL CHANNELS 
router.get('/', channelsController.getAllChannels);
// GET CHANNELS BY ID
router.get('/:id', channelsController.getChannelById);
// PUT CHANNELS BY ID
router.put('/:id', channelsController.updateChannel);
// DELETE CHANNELS BY ID
router.delete('/:id', channelsController.deleteChannel);
// POST SUBSCRIBE TO CHANNELS
router.post('/subscribe', channelsController.subscribeChannel);
//! DELETE SUBSCRIBE 
// router.delete(
//   '/unsubscribe', channelsController.unsubscribeChannel
// );

module.exports = router;
