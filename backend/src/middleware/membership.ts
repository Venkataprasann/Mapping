import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { db } from '../services/database.js';

export const requireTripMembership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tripId = req.params.tripId || req.body.tripId;
    const user = req.user;

    if (!tripId) {
      res.status(400).json({ error: 'Bad Request', message: 'Trip ID parameter is required.' });
      return;
    }

    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User must be authenticated.' });
      return;
    }

    const trip = await db.getTripById(tripId);
    if (!trip) {
      res.status(404).json({ error: 'Not Found', message: `Trip with ID "${tripId}" was not found.` });
      return;
    }

    // Verify membership: Creator OR accepted participant
    const isCreator = trip.creatorId === user.id;
    const isParticipant = trip.participants.some(p => p.userId === user.id);

    if (!isCreator && !isParticipant) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied. You are not an accepted member of this synchronized trip.'
      });
      return;
    }

    // Attach trip to request for convenience in subsequent handlers
    (req as any).trip = trip;
    next();
  } catch (err: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to evaluate trip membership: ' + err.message
    });
  }
};
