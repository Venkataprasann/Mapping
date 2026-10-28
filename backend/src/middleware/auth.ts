import { Request, Response, NextFunction } from 'express';
import { db, UserProfile } from '../services/database.js';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const devUserId = req.headers['x-user-id'] as string;

    // Check for authorization header or development x-user-id header
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // If token is in format "usr-...", extract user ID directly (dev token)
      if (token.startsWith('usr-') || token.startsWith('user-')) {
        userId = token;
      } else {
        // Here Supabase JWT verification would be performed:
        // const { data, error } = await supabase.auth.getUser(token);
        // userId = data.user?.id;
        userId = token;
      }
    } else if (devUserId) {
      userId = devUserId;
    }

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token or header is missing or invalid.'
      });
      return;
    }

    // Lookup or auto-provision development user profile
    let profile = await db.getProfile(userId);
    if (!profile) {
      profile = {
        id: userId,
        email: `${userId}@syncroute.ai`,
        displayName: userId === 'user-friend-a' ? 'Friend A (You)' : userId === 'user-friend-b' ? 'Friend B (Arjun)' : 'Traveller',
        locationSharingEnabled: true,
        createdAt: new Date().toISOString()
      };
      await db.saveProfile(profile);
    }

    req.user = profile;
    next();
  } catch (err: any) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Failed to authenticate user session: ' + err.message
    });
  }
};
