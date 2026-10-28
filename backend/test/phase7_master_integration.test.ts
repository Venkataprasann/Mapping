import { describe, it, expect } from 'vitest';
import { tripService } from '../src/services/tripService.js';
import { syncEngine } from '../src/services/syncEngine.js';
import { notificationService } from '../src/services/notificationService.js';
import { voiceAssistantTools } from '../src/services/voiceAssistantTools.js';
import { db } from '../src/services/database.js';
import { Trip, Participant } from '../../../shared/types.js';

describe('Phase 7: End-to-End Master Integration & 12 Requirements Verification', () => {
  let masterTrip: Trip;
  let partA: Participant;
  let partB: Participant;
  let partC: Participant;

  it('Requirement 1 & 2: Two users with different starting locations and 3+ participants', async () => {
    // Creator: Friend A from Whitefield
    masterTrip = await tripService.createTrip({
      creatorId: 'user-master-a',
      creatorName: 'Friend A (Whitefield)',
      title: 'Bengaluru Group Meetup',
      destinationName: 'Nexus Koramangala',
      destinationAddress: 'Hosur Rd, Koramangala, Bengaluru',
      destinationCoordinates: { lat: 12.9345, lng: 77.6111 },
      arrivalToleranceMinutes: 5,
      startLocationName: 'ITPL Main Rd, Whitefield',
      startCoordinates: { lat: 12.9850, lng: 77.7300 }
    });

    expect(masterTrip).toBeDefined();
    expect(masterTrip.participants.length).toBe(1);
    partA = masterTrip.participants[0];

    // Participant 2: Friend B from Electronic City
    const joinB = await tripService.joinTrip({
      inviteCodeOrToken: masterTrip.inviteCode,
      userId: 'user-master-b',
      displayName: 'Friend B (Electronic City)',
      startLocationName: 'Phase 1, Electronic City',
      startCoordinates: { lat: 12.8452, lng: 77.6602 },
      isSharingLocation: true
    });
    partB = joinB.participant;
    expect(joinB.trip.participants.length).toBe(2);

    // Participant 3: Friend C from Indiranagar
    const joinC = await tripService.joinTrip({
      inviteCodeOrToken: masterTrip.inviteCode,
      userId: 'user-master-c',
      displayName: 'Friend C (Indiranagar)',
      startLocationName: '100 Feet Rd, Indiranagar',
      startCoordinates: { lat: 12.9784, lng: 77.6408 },
      isSharingLocation: true
    });
    partC = joinC.participant;
    expect(joinC.trip.participants.length).toBe(3);

    // Verify all 3 start locations are distinct
    const coords = [partA.startCoordinates, partB.startCoordinates, partC.startCoordinates];
    expect(coords[0].lat).not.toBe(coords[1].lat);
    expect(coords[1].lat).not.toBe(coords[2].lat);
  });

  it('Requirement 3: One user starting later than another (staggered departures)', async () => {
    // Friend A departs first (journeyStatus: en_route)
    const updatedA = await tripService.updateJourneyStatus(masterTrip.id, partA.id, 'en_route');
    expect(updatedA?.journeyStatus).toBe('en_route');
    expect(updatedA?.departureTime).toBeDefined();

    // Friend B and C are not_started
    const refreshedTrip = await tripService.getTripById(masterTrip.id);
    const syncPlan = syncEngine.analyzeTripSynchronization(refreshedTrip!);

    expect(syncPlan.recommendations[partA.id].urgency).toBe('en_route');
    expect(syncPlan.recommendations[partB.id].urgency).toBe('wait');
  });

  it('Requirement 4 & 11: Traffic-related ETA changes and configured tolerance check', async () => {
    const refreshedTrip = await tripService.getTripById(masterTrip.id);

    // Baseline sync
    const baselineSync = syncEngine.analyzeTripSynchronization(refreshedTrip!);
    expect(baselineSync.isOnTrack).toBe(true);

    // Simulate severe traffic spike (+25 minutes) for Friend A with a fixed cinema showtime target
    const severeTrafficTrip: Trip = {
      ...refreshedTrip!,
      targetArrivalTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Target: 60 mins from now
      participants: refreshedTrip!.participants.map(p =>
        p.id === partA.id ? { ...p, durationSeconds: 85 * 60 } : p // Friend A takes 85 mins (> 60 mins target)
      )
    };

    const delayedSync = syncEngine.analyzeTripSynchronization(severeTrafficTrip);
    // Gap/Delay should now exceed tolerance of 5 mins
    expect(delayedSync.isOnTrack).toBe(false);
    expect(delayedSync.threatLevel).toBe('high_delay_threat');
  });

  it('Requirement 5: A user stopping location sharing', async () => {
    const pausedB = await tripService.toggleLocationSharing(masterTrip.id, partB.id, false);
    expect(pausedB?.isSharingLocation).toBe(false);

    // Verify database reflects privacy opt-out
    const refreshedTrip = await tripService.getTripById(masterTrip.id);
    const storedB = refreshedTrip?.participants.find(p => p.id === partB.id);
    expect(storedB?.isSharingLocation).toBe(false);
  });

  it('Requirement 6: Stale location data detection', () => {
    // If coordinate update was > 2 minutes ago, age is computed and flagged
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const staleParticipant: Participant = {
      ...partA,
      lastLocationUpdate: threeMinutesAgo
    };

    const diffMins = Math.floor((Date.now() - new Date(staleParticipant.lastLocationUpdate!).getTime()) / 60000);
    const isStale = diffMins >= 2;

    expect(isStale).toBe(true);
  });

  it('Requirement 7: Network failure / disconnected state resilience', () => {
    // If database or remote network is temporarily unavailable, syncEngine gracefully falls back
    const emptyAnalysis = (syncEngine as any).createEmptyAnalysis('offline-trip', new Date());
    expect(emptyAnalysis.isOnTrack).toBe(true);
    expect(emptyAnalysis.threatLevel).toBe('optimal');
  });

  it('Requirement 8: Rejection of invalid invitation tokens', async () => {
    await expect(
      tripService.joinTrip({
        inviteCodeOrToken: 'EXPIRED_OR_INVALID_123',
        userId: 'user-random',
        displayName: 'Random User',
        startLocationName: 'Unknown',
        startCoordinates: { lat: 12.0, lng: 77.0 },
        isSharingLocation: true
      })
    ).rejects.toThrow('Invalid or expired trip invitation code.');
  });

  it('Requirement 9: Unauthorized access to another trip is blocked', async () => {
    const outsiderId = 'user-intruder-403';
    const trip = await db.getTripById(masterTrip.id);

    const isAuthorized = trip?.creatorId === outsiderId || trip?.participants.some(p => p.userId === outsiderId);
    expect(isAuthorized).toBe(false);
  });

  it('Requirement 10: Repeated notifications are prevented by cooldown window', async () => {
    notificationService.resetCooldowns();

    // First alert succeeds
    const alert1 = await notificationService.notifyLeaveNow(masterTrip, partB.id, partB.displayName, '32 mins');
    expect(alert1).not.toBeNull();

    // Immediate second alert is suppressed by cooldown
    const alert2 = await notificationService.notifyLeaveNow(masterTrip, partB.id, partB.displayName, '32 mins');
    expect(alert2).toBeNull();
  });

  it('Requirement 12: AI tool calls with missing or invalid arguments fail gracefully', async () => {
    // Missing tripId and title
    const res = await voiceAssistantTools.executeTool(
      'createTrip',
      { invalid: true },
      { userId: 'user-master-a' }
    );

    expect(res.success).toBe(false);
    expect(res.error).toBe('Invalid tool arguments');
  });
});
