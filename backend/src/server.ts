import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/index.js';
import { authRoutes } from './routes/authRoutes.js';
import { tripRoutes } from './routes/tripRoutes.js';
import { routeRoutes } from './routes/routeRoutes.js';
import { voiceRoutes } from './routes/voiceRoutes.js';
import { tripService } from './services/tripService.js';
import { syncEngine } from './services/syncEngine.js';
import { notificationService } from './services/notificationService.js';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
export const io = new SocketIOServer(server, {
  cors: {
    origin: config.allowedOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Middleware
app.use(cors({
  origin: config.allowedOrigin,
  credentials: true
}));
app.use(express.json());

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString().substring(11, 19)}] ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'SyncRoute AI Backend',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/voice', voiceRoutes);

// Socket.IO Room Management for Live Trip Updates
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join_trip', async (tripId: string) => {
    socket.join(`trip:${tripId}`);
    console.log(`[Socket.IO] Client ${socket.id} joined trip room: trip:${tripId}`);

    // Send latest trip and sync plan upon joining
    const trip = await tripService.getTripById(tripId);
    if (trip) {
      const syncPlan = syncEngine.analyzeTripSynchronization(trip);
      socket.emit('trip_updated', trip);
      socket.emit('sync_updated', syncPlan);
    }
  });

  socket.on('leave_trip', (tripId: string) => {
    socket.leave(`trip:${tripId}`);
    console.log(`[Socket.IO] Client ${socket.id} left trip room: trip:${tripId}`);
  });

  // Real-time location stream from participant browser GPS
  socket.on('location_update', async (data: { tripId: string; participantId: string; coords: { lat: number; lng: number } }) => {
    try {
      const { tripId, participantId, coords } = data;
      const trip = await tripService.getTripById(tripId);
      if (!trip) return;

      const participant = trip.participants.find(p => p.id === participantId);
      if (!participant || !participant.isSharingLocation) return; // Strict privacy check

      await tripService.updateLocation(tripId, participantId, coords);
      const updatedTrip = await tripService.getTripById(tripId);
      if (updatedTrip) {
        const syncPlan = syncEngine.analyzeTripSynchronization(updatedTrip);
        io.to(`trip:${tripId}`).emit('trip_updated', updatedTrip);
        io.to(`trip:${tripId}`).emit('sync_updated', syncPlan);
      }
    } catch (err) {
      console.error('[Socket.IO] Error handling location_update:', err);
    }
  });

  // Journey status update (not_started -> en_route -> arrived)
  socket.on('status_update', async (data: { tripId: string; participantId: string; status: any }) => {
    try {
      const { tripId, participantId, status } = data;
      await tripService.updateJourneyStatus(tripId, participantId, status);
      const updatedTrip = await tripService.getTripById(tripId);
      if (updatedTrip) {
        const syncPlan = syncEngine.analyzeTripSynchronization(updatedTrip);
        io.to(`trip:${tripId}`).emit('trip_updated', updatedTrip);
        io.to(`trip:${tripId}`).emit('sync_updated', syncPlan);

        const participant = updatedTrip.participants.find(p => p.id === participantId);
        if (status === 'arrived' && participant) {
          await notificationService.notifyParticipantArrived(updatedTrip, participantId, participant.displayName);
        }
      }
    } catch (err) {
      console.error('[Socket.IO] Error handling status_update:', err);
    }
  });

  // Toggle location sharing on/off
  socket.on('sharing_update', async (data: { tripId: string; participantId: string; isSharing: boolean }) => {
    try {
      const { tripId, participantId, isSharing } = data;
      await tripService.toggleLocationSharing(tripId, participantId, isSharing);
      const updatedTrip = await tripService.getTripById(tripId);
      if (updatedTrip) {
        io.to(`trip:${tripId}`).emit('trip_updated', updatedTrip);
      }
    } catch (err) {
      console.error('[Socket.IO] Error handling sharing_update:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Start Server if run directly
if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, () => {
    console.log(`🚀 SyncRoute AI backend running on port ${config.port} [${config.nodeEnv}]`);
  });
}

export { app, server };
