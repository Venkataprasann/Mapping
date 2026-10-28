import { Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).max(50),
  locationSharingEnabled: z.boolean().default(true)
});

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email } = loginSchema.parse(req.body);
      let user = await db.getProfileByEmail(email);

      if (!user) {
        // Auto-provision for demo/testing convenience
        const userId = 'usr-' + uuidv4().substring(0, 8);
        user = {
          id: userId,
          email,
          displayName: email.split('@')[0],
          locationSharingEnabled: true,
          createdAt: new Date().toISOString()
        };
        await db.saveProfile(user);
      }

      // Generate session token (user ID acts as dev token / JWT bearer)
      res.status(200).json({
        message: 'Login successful',
        token: user.id,
        user
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', issues: err.issues });
        return;
      }
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async signup(req: Request, res: Response): Promise<void> {
    try {
      const data = signupSchema.parse(req.body);
      const existing = await db.getProfileByEmail(data.email);
      if (existing) {
        res.status(409).json({ error: 'Conflict', message: 'User with this email already exists.' });
        return;
      }

      const userId = 'usr-' + uuidv4().substring(0, 8);
      const profile = {
        id: userId,
        email: data.email,
        displayName: data.displayName,
        locationSharingEnabled: data.locationSharingEnabled,
        createdAt: new Date().toISOString()
      };

      await db.saveProfile(profile);

      res.status(201).json({
        message: 'Account created successfully',
        token: profile.id,
        user: profile
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', issues: err.issues });
        return;
      }
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({ user: req.user });
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { displayName, locationSharingEnabled } = req.body;

      if (displayName !== undefined) user.displayName = displayName;
      if (locationSharingEnabled !== undefined) user.locationSharingEnabled = Boolean(locationSharingEnabled);

      await db.saveProfile(user);
      res.status(200).json({ message: 'Profile updated', user });
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }
}

export const authController = new AuthController();
