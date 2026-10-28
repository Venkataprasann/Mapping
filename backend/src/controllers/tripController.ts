import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { tripService } from '../services/tripService.js';
import { syncEngine } from '../services/syncEngine.js';

// Schemas
const createTripSchema = z.object({
  title: z.string().min(2).max(100),
  destinationName: z.string().min(2),
  destinationAddress: z.string().min(5),
  destinationCoordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  targetArrivalTime: z.string().datetime().optional(),
  arrivalToleranceMinutes: z.number().min(1).max(60).default(5),
  startLocationName: z.string().min(2),
  startCoordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  })
});

const joinTripSchema = z.object({
  inviteCodeOrToken: z.string().min(4),
  displayName: z.string().min(2).max(50),
  startLocationName: z.string().min(2),
  startCoordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  isSharingLocation: z.boolean().default(true)
});

const updateLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

const updateStatusSchema = z.object({
  journeyStatus: z.enum(['not_started', 'en_route', 'arrived', 'paused'])
});

export class TripController {
  async createTrip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validated = createTripSchema.parse(req.body);
      const user = req.user!;

      const trip = await tripService.createTrip({
        creatorId: user.id,
        creatorName: user.displayName,
        ...validated
      });

      res.status(201).json({
        message: 'Trip created successfully',
        trip
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', issues: err.issues });
        return;
      }
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getTrip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Membership already guaranteed by requireTripMembership middleware
      const trip = (req as any).trip;
      res.status(200).json({ trip });
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getTripByInvite(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const code = req.params.code as string;
      const trip = await tripService.getTripByInvite(code);

      if (!trip) {
        res.status(404).json({ error: 'Not Found', message: 'Trip invitation code is invalid or expired.' });
        return;
      }

      // Return public preview info (destination and title, not revealing participant coordinates)
      res.status(200).json({
        trip: {
          id: trip.id,
          title: trip.title,
          destinationName: trip.destinationName,
          destinationAddress: trip.destinationAddress,
          targetArrivalTime: trip.targetArrivalTime,
          arrivalToleranceMinutes: trip.arrivalToleranceMinutes,
          participantCount: trip.participants.length
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async joinTrip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validated = joinTripSchema.parse(req.body);
      const user = req.user!;

      const result = await tripService.joinTrip({
        ...validated,
        userId: user.id
      });

      res.status(200).json({
        message: 'Successfully joined trip',
        trip: result.trip,
        participant: result.participant
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', issues: err.issues });
        return;
      }
      res.status(400).json({ error: 'Bad Request', message: err.message });
    }
  }

  async listUserTrips(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const trips = await tripService.listUserTrips(user.id);
      res.status(200).json({ trips });
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async updateLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tripId = req.params.tripId as string;
      const participantId = req.params.participantId as string;
      const validated = updateLocationSchema.parse(req.body);

      const participant = await tripService.updateLocation(tripId, participantId, validated);
      if (!participant) {
        res.status(404).json({ error: 'Participant not found' });
        return;
      }

      res.status(200).json({ participant });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', issues: err.issues });
        return;
      }
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tripId = req.params.tripId as string;
      const participantId = req.params.participantId as string;
      const validated = updateStatusSchema.parse(req.body);

      const participant = await tripService.updateJourneyStatus(tripId, participantId, validated.journeyStatus);
      if (!participant) {
        res.status(404).json({ error: 'Participant not found' });
        return;
      }

      res.status(200).json({ participant });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', issues: err.issues });
        return;
      }
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async toggleLocationSharing(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tripId = req.params.tripId as string;
      const participantId = req.params.participantId as string;
      const { isSharingLocation } = req.body;

      const participant = await tripService.toggleLocationSharing(tripId, participantId, Boolean(isSharingLocation));
      if (!participant) {
        res.status(404).json({ error: 'Participant not found' });
        return;
      }

      res.status(200).json({ participant });
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async leaveTrip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tripId = req.params.tripId as string;
      const participantId = req.params.participantId as string;
      const success = await tripService.leaveTrip(tripId, participantId);
      res.status(200).json({ success, message: 'Left trip successfully' });
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getTripSyncAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const trip = (req as any).trip;
      const analysis = syncEngine.analyzeTripSynchronization(trip);
      res.status(200).json({ analysis });
    } catch (err: any) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }
}

export const tripController = new TripController();
