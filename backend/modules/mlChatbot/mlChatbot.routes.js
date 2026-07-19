import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import mlChatbotController from './mlChatbot.controller.js';

const router = express.Router();

router.get('/status', requireAuth, mlChatbotController.getStatus);
router.post('/chat', requireAuth, mlChatbotController.chat);

export default router;
