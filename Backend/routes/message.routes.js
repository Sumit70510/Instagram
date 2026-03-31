import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { getMessage, sendMessage, getAllConversations } from '../controllers.js/message.controller.js';

const router = express.Router();

router.route('/send/:id').post(isAuthenticated,sendMessage);
router.route('/all/:id').get(isAuthenticated,getMessage);
router.route('/conversations/get').get(isAuthenticated,getAllConversations);

export default router;