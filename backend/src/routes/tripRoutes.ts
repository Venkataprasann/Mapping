import { Router } from 'express';
import { tripController } from '../controllers/tripController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTripMembership } from '../middleware/membership.js';

export const tripRoutes = Router();

// Protected user trips management
tripRoutes.get('/', requireAuth, (req, res) => tripController.listUserTrips(req, res));
tripRoutes.post('/', requireAuth, (req, res) => tripController.createTrip(req, res));

// Trip invite inspection and joining
tripRoutes.get('/invite/:code', (req, res) => tripController.getTripByInvite(req, res));
tripRoutes.post('/join', requireAuth, (req, res) => tripController.joinTrip(req, res));

// Trip membership protected endpoints
tripRoutes.get('/:tripId', requireAuth, requireTripMembership, (req, res) => tripController.getTrip(req, res));
tripRoutes.get('/:tripId/sync', requireAuth, requireTripMembership, (req, res) => tripController.getTripSyncAnalysis(req, res));
tripRoutes.patch('/:tripId/participants/:participantId/location', requireAuth, requireTripMembership, (req, res) => tripController.updateLocation(req, res));
tripRoutes.patch('/:tripId/participants/:participantId/status', requireAuth, requireTripMembership, (req, res) => tripController.updateStatus(req, res));
tripRoutes.patch('/:tripId/participants/:participantId/sharing', requireAuth, requireTripMembership, (req, res) => tripController.toggleLocationSharing(req, res));
tripRoutes.post('/:tripId/participants/:participantId/leave', requireAuth, requireTripMembership, (req, res) => tripController.leaveTrip(req, res));
