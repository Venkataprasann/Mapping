import { Trip, GroupSyncAnalysis } from '@shared/types';

export const BENGALURU_CINEMA_TRIP: Trip = {
  id: 'bengaluru-sync-demo-01',
  creatorId: 'user-friend-a',
  title: 'Movie Night @ PVR Nexus Koramangala',
  destinationName: 'PVR Cinemas, Nexus Mall Koramangala',
  destinationAddress: 'Hosur Rd, Chikku Lakshmaiah Layout, Koramangala, Bengaluru, Karnataka 560095',
  destinationCoordinates: {
    lat: 12.9345,
    lng: 77.6111
  },
  targetArrivalTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
  arrivalToleranceMinutes: 5,
  status: 'active',
  inviteCode: 'BLR779',
  inviteToken: 'demo-tok-bengaluru-9988',
  inviteExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  participants: [
    {
      id: 'part-01-a',
      tripId: 'bengaluru-sync-demo-01',
      userId: 'user-friend-a',
      displayName: 'Friend A (You)',
      startLocationName: 'ITPL Main Rd, Whitefield, Bengaluru',
      startCoordinates: {
        lat: 12.9850,
        lng: 77.7300
      },
      currentCoordinates: {
        lat: 12.9850,
        lng: 77.7300
      },
      isSharingLocation: true,
      journeyStatus: 'not_started',
      recommendedDepartureTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 mins from now
      predictedArrivalTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      durationSeconds: 55 * 60, // 55 minutes
      distanceMeters: 21400, // 21.4 km
      trafficStatus: 'heavy',
      isDemo: true,
      lastLocationUpdate: new Date().toISOString()
    },
    {
      id: 'part-02-b',
      tripId: 'bengaluru-sync-demo-01',
      userId: 'user-friend-b',
      displayName: 'Friend B (Arjun)',
      startLocationName: 'Phase 1, Electronic City, Bengaluru',
      startCoordinates: {
        lat: 12.8452,
        lng: 77.6602
      },
      currentCoordinates: {
        lat: 12.8452,
        lng: 77.6602
      },
      isSharingLocation: true,
      journeyStatus: 'not_started',
      recommendedDepartureTime: new Date(Date.now() + 28 * 60 * 1000).toISOString(), // 28 mins from now!
      predictedArrivalTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      durationSeconds: 32 * 60, // 32 minutes via Elevated Tollway
      distanceMeters: 14200, // 14.2 km
      trafficStatus: 'moderate',
      isDemo: true,
      lastLocationUpdate: new Date().toISOString()
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const BENGALURU_SYNC_ANALYSIS: GroupSyncAnalysis = {
  tripId: 'bengaluru-sync-demo-01',
  targetArrivalTime: BENGALURU_CINEMA_TRIP.targetArrivalTime!,
  isFixedTarget: true,
  earliestArrivalParticipant: 'Friend A (You)',
  latestArrivalParticipant: 'Friend B (Arjun)',
  arrivalGapSeconds: 0,
  arrivalGapFormatted: '0 mins (Synchronized)',
  isOnTrack: true,
  toleranceMinutes: 5,
  threatLevel: 'optimal',
  recommendations: {
    'part-01-a': {
      participantId: 'part-01-a',
      displayName: 'Friend A (You)',
      recommendedDepartureTime: BENGALURU_CINEMA_TRIP.participants[0].recommendedDepartureTime!,
      predictedArrivalTime: BENGALURU_CINEMA_TRIP.participants[0].predictedArrivalTime!,
      countdownSeconds: 300,
      urgency: 'prepare',
      travelDurationFormatted: '55 mins',
      distanceFormatted: '21.4 km',
      adviceMessage: 'Whitefield has heavy traffic near Marathahalli. Prepare to leave in ~5 minutes.'
    },
    'part-02-b': {
      participantId: 'part-02-b',
      displayName: 'Friend B (Arjun)',
      recommendedDepartureTime: BENGALURU_CINEMA_TRIP.participants[1].recommendedDepartureTime!,
      predictedArrivalTime: BENGALURU_CINEMA_TRIP.participants[1].predictedArrivalTime!,
      countdownSeconds: 1680,
      urgency: 'wait',
      travelDurationFormatted: '32 mins',
      distanceFormatted: '14.2 km',
      adviceMessage: 'You are closer via Electronic City Flyover. Relax, recommended departure in 28 minutes.'
    }
  },
  lastCalculatedAt: new Date().toISOString()
};
