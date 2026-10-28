import { describe, it, expect } from 'vitest';
import { syncEngine } from '../src/services/syncEngine.js';
import { Trip, Participant } from '../../../shared/types.js';

describe('Phase 4: Dedicated Journey Synchronization Engine', () => {
  const fixedNow = new Date('2026-10-28T18:00:00.000Z'); // 6:00 PM UTC

  const baseTrip: Trip = {
    id: 'test-trip-sync-01',
    creatorId: 'user-a',
    title: 'Cinema Meetup Koramangala',
    destinationName: 'PVR Nexus Koramangala',
    destinationAddress: 'Hosur Rd, Koramangala, Bengaluru',
    destinationCoordinates: { lat: 12.9345, lng: 77.6111 },
    targetArrivalTime: new Date('2026-10-28T19:00:00.000Z').toISOString(), // 7:00 PM UTC
    arrivalToleranceMinutes: 5,
    status: 'active',
    inviteCode: 'TEST01',
    inviteToken: 'tok-01',
    inviteExpiresAt: new Date('2026-10-30T18:00:00.000Z').toISOString(),
    participants: [
      {
        id: 'part-whitefield',
        tripId: 'test-trip-sync-01',
        userId: 'user-a',
        displayName: 'Friend A (Whitefield)',
        startLocationName: 'Whitefield',
        startCoordinates: { lat: 12.9850, lng: 77.7300 },
        isSharingLocation: true,
        journeyStatus: 'not_started',
        durationSeconds: 50 * 60, // 50 mins
        distanceMeters: 21000
      },
      {
        id: 'part-ecity',
        tripId: 'test-trip-sync-01',
        userId: 'user-b',
        displayName: 'Friend B (Electronic City)',
        startLocationName: 'Electronic City',
        startCoordinates: { lat: 12.8452, lng: 77.6602 },
        isSharingLocation: true,
        journeyStatus: 'not_started',
        durationSeconds: 30 * 60, // 30 mins
        distanceMeters: 14000
      }
    ],
    createdAt: fixedNow.toISOString(),
    updatedAt: fixedNow.toISOString()
  };

  it('1. Calculates synchronized departures for two users with unequal starting locations', () => {
    const analysis = syncEngine.analyzeTripSynchronization(baseTrip, {
      currentTime: fixedNow,
      bufferSeconds: 0
    });

    expect(analysis.isFixedTarget).toBe(true);
    expect(analysis.isOnTrack).toBe(true);
    expect(analysis.threatLevel).toBe('optimal');

    const recA = analysis.recommendations['part-whitefield'];
    const recB = analysis.recommendations['part-ecity'];

    // Friend A takes 50 mins -> to arrive at 7:00 PM, must depart at 6:10 PM (600s after 6:00 PM)
    expect(new Date(recA.recommendedDepartureTime).toISOString()).toBe('2026-10-28T18:10:00.000Z');
    expect(recA.countdownSeconds).toBe(600); // 10 mins countdown

    // Friend B takes 30 mins -> to arrive at 7:00 PM, must depart at 6:30 PM (1800s after 6:00 PM)
    expect(new Date(recB.recommendedDepartureTime).toISOString()).toBe('2026-10-28T18:30:00.000Z');
    expect(recB.countdownSeconds).toBe(1800); // 30 mins countdown
    expect(recB.urgency).toBe('wait');
  });

  it('2. Synchronizes 3 or more participants accurately', () => {
    const threeUserTrip: Trip = {
      ...baseTrip,
      participants: [
        ...baseTrip.participants,
        {
          id: 'part-indiranagar',
          tripId: 'test-trip-sync-01',
          userId: 'user-c',
          displayName: 'Friend C (Indiranagar)',
          startLocationName: 'Indiranagar 100ft Rd',
          startCoordinates: { lat: 12.9784, lng: 77.6408 },
          isSharingLocation: true,
          journeyStatus: 'not_started',
          durationSeconds: 20 * 60, // 20 mins
          distanceMeters: 7500
        }
      ]
    };

    const analysis = syncEngine.analyzeTripSynchronization(threeUserTrip, {
      currentTime: fixedNow,
      bufferSeconds: 0
    });

    expect(Object.keys(analysis.recommendations).length).toBe(3);
    const recC = analysis.recommendations['part-indiranagar'];

    // Friend C takes 20 mins -> must depart at 6:40 PM (2400s after 6:00 PM)
    expect(new Date(recC.recommendedDepartureTime).toISOString()).toBe('2026-10-28T18:40:00.000Z');
    expect(recC.countdownSeconds).toBe(2400); // 40 minutes countdown
  });

  it('3. Handles dynamic anchoring when one user is already en_route and another has not started', () => {
    // Dynamic trip (no fixed targetArrivalTime)
    const dynamicTrip: Trip = {
      ...baseTrip,
      targetArrivalTime: undefined,
      participants: [
        {
          ...baseTrip.participants[0],
          journeyStatus: 'en_route',
          departureTime: new Date('2026-10-28T18:00:00.000Z').toISOString(), // Started right at 6:00 PM
          durationSeconds: 50 * 60 // Remaining 50 mins
        },
        {
          ...baseTrip.participants[1],
          journeyStatus: 'not_started',
          durationSeconds: 30 * 60
        }
      ]
    };

    const analysis = syncEngine.analyzeTripSynchronization(dynamicTrip, {
      currentTime: fixedNow,
      bufferSeconds: 0
    });

    // Target arrival is anchored to Friend A's arrival (6:50 PM UTC)
    expect(new Date(analysis.targetArrivalTime).toISOString()).toBe('2026-10-28T18:50:00.000Z');

    // Friend B (takes 30 mins) recommended departure: 6:50 PM - 30 mins = 6:20 PM
    const recB = analysis.recommendations['part-ecity'];
    expect(new Date(recB.recommendedDepartureTime).toISOString()).toBe('2026-10-28T18:20:00.000Z');
    expect(recB.countdownSeconds).toBe(1200); // 20 minutes from now
  });

  it('4. Detects traffic delays and flags Delay Threat when arrival gap exceeds tolerance', () => {
    // Friend A gets hit by a 20-minute traffic spike (duration increases to 70 mins)
    const delayedTrip: Trip = {
      ...baseTrip,
      participants: [
        {
          ...baseTrip.participants[0],
          durationSeconds: 70 * 60 // 70 minutes (cannot reach by 7:00 PM, arrives at 7:10 PM)
        },
        baseTrip.participants[1]
      ]
    };

    const analysis = syncEngine.analyzeTripSynchronization(delayedTrip, {
      currentTime: fixedNow,
      bufferSeconds: 0
    });

    // Arrival gap: Friend A reaches at 7:10 PM, Friend B at 7:00 PM -> Gap is 10 mins (600s)
    // Configured tolerance is 5 mins (300s) -> Must flag NOT on track
    expect(analysis.isOnTrack).toBe(false);
    expect(analysis.arrivalGapSeconds).toBe(600);
    expect(analysis.threatLevel).toBe('high_delay_threat');
  });

  it('5. Evaluates notification triggers with anti-flapping thresholds', () => {
    const analysisBefore = syncEngine.analyzeTripSynchronization(baseTrip, { currentTime: fixedNow });

    // Scenario A: Jitter of only 30 seconds (traffic flutter)
    const flutterTrip: Trip = {
      ...baseTrip,
      participants: [
        {
          ...baseTrip.participants[0],
          durationSeconds: baseTrip.participants[0].durationSeconds + 30 // +30s flutter
        },
        baseTrip.participants[1]
      ]
    };
    const analysisFlutter = syncEngine.analyzeTripSynchronization(flutterTrip, { currentTime: fixedNow });

    // Under 180s damping threshold: NO spam notification
    const notificationsFlutter = syncEngine.evaluateNotificationEvents(flutterTrip, analysisFlutter, analysisBefore, 180);
    expect(notificationsFlutter.length).toBe(0);

    // Scenario B: Meaningful 6-minute delay (360s >= 180s threshold)
    const realDelayTrip: Trip = {
      ...baseTrip,
      participants: [
        {
          ...baseTrip.participants[0],
          durationSeconds: baseTrip.participants[0].durationSeconds + 360 // +6 mins
        },
        baseTrip.participants[1]
      ]
    };
    const analysisDelay = syncEngine.analyzeTripSynchronization(realDelayTrip, { currentTime: fixedNow });
    const notificationsDelay = syncEngine.evaluateNotificationEvents(realDelayTrip, analysisDelay, analysisBefore, 180);

    expect(notificationsDelay.length).toBeGreaterThanOrEqual(1);
    expect(notificationsDelay.some(n => n.type === 'delay_threat')).toBe(true);
  });
});
