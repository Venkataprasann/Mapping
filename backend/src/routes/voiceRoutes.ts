import { Router } from 'express';
import { voiceController } from '../controllers/voiceController.js';
import { requireAuth } from '../middleware/auth.js';

export const voiceRoutes = Router();

voiceRoutes.post('/command', requireAuth, (req, res) => voiceController.handleVoiceCommand(req, res));
