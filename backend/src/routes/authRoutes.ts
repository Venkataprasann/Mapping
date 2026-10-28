import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

export const authRoutes = Router();

authRoutes.post('/login', (req, res) => authController.login(req, res));
authRoutes.post('/signup', (req, res) => authController.signup(req, res));
authRoutes.get('/me', requireAuth, (req, res) => authController.getMe(req, res));
authRoutes.patch('/profile', requireAuth, (req, res) => authController.updateProfile(req, res));
