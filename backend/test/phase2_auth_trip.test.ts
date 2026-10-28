import { describe, it, expect, beforeAll } from 'vitest';
import { tripService } from '../src/services/tripService.js';
import { db } from '../src/services/database.js';

describe('Phase 2: Authentication, Database Schema & Trip Creation', () => {
  let createdTripId: string;
  let inviteCode: string;

  beforeAll(async () => {
    // Database initializes with seeded users
  });

  it('should authenticate and retrieve seeded user profiles', async () => {
    const userA = await db.getProfile('user-friend-a');
    expect(userA).toBeDefined();
    expect(userA?.displayName).toBe('Friend A (You)');
    expect(userA?.locationSharingEnabled).toBe(true);
  });

  it('should create a synchronized shared trip with destination and creator starting point', async () => {
    const trip = await tripService.createTrip({
      creatorId: 'user-friend-a',
      creatorName: 'Friend A (You)',
      title: 'PVR Nexus Movie Trip',
      destinationName: 'PVR Cinemas, Nexus Koramangala',
      destinationAddress: 'Hosur Rd, Koramangala, Bengaluru',
      destinationCoordinates: { lat: 12.9345, lng: 77.6111 },
      targetArrivalTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      arrivalToleranceMinutes: 5,
      startLocationName: 'ITPL Main Rd, Whitefield',
      startCoordinates: { lat: 12.9850, lng: 77.7300 }
    });

    expect(trip).toBeDefined();
    expect(trip.id).toBeDefined();
    expect(trip.inviteCode).toMatch(/^SR-[A-Z0-9]{4}$/);
    expect(trip.inviteToken).toBeDefined();
    expect(trip.participants.length).toBe(1);
    expect(trip.participants[0].userId).toBe('user-friend-a');
    expect(trip.participants[0].startLocationName).toContain('Whitefield');

    createdTripId = trip.id;
    inviteCode = trip.inviteCode;
  });

  it('should allow second participant (Friend B) to join using trip invite code', async () => {
    const { trip, participant } = await tripService.joinTrip({
      inviteCodeOrToken: inviteCode,
      userId: 'user-friend-b',
      displayName: 'Friend B (Arjun)',
      startLocationName: 'Phase 1, Electronic City',
      startCoordinates: { lat: 12.8452, lng: 77.6602 },
      isSharingLocation: true
    });

    expect(participant.displayName).toBe('Friend B (Arjun)');
    expect(participant.startLocationName).toContain('Electronic City');
    expect(trip.participants.length).toBe(2);

    // Verify both different starting locations exist
    const friendA = trip.participants.find(p => p.userId === 'user-friend-a');
    const friendB = trip.participants.find(p => p.userId === 'user-friend-b');
    expect(friendA?.startCoordinates.lat).toBeCloseTo(12.9850, 2);
    expect(friendB?.startCoordinates.lat).toBeCloseTo(12.8452, 2);
  });

  it('should reject invalid or non-existent invitation tokens', async () => {
    await expect(
      tripService.joinTrip({
        inviteCodeOrToken: 'INVALID-CODE-999',
        userId: 'user-intruder',
        displayName: 'Intruder',
        startLocationName: 'Somewhere',
        startCoordinates: { lat: 12.0, lng: 77.0 },
        isSharingLocation: true
      })
    ).rejects.toThrow('Invalid or expired trip invitation code.');
  });

  it('should allow participant to toggle location sharing off and on', async () => {
    const trip = await db.getTripById(createdTripId);
    const participantB = trip?.participants.find(p => p.userId === 'user-friend-b');
    expect(participantB).toBeDefined();

    // Toggle off
    const updated = await tripService.toggleLocationSharing(createdTripId, participantB!.id, false);
    expect(updated?.isSharingLocation).toBe(false);

    // Toggle back on
    const updatedOn = await tripService.toggleLocationSharing(createdTripId, participantB!.id, true);
    expect(updatedOn?.isSharingLocation).toBe(true);
  });

  it('should update participant journey status to en_route and record departure time', async () => {
    const trip = await db.getTripById(createdTripId);
    const participantA = trip?.participants.find(p => p.userId === 'user-friend-a');

    const updated = await tripService.updateJourneyStatus(createdTripId, participantA!.id, 'en_route');
    expect(updated?.journeyStatus).toBe('en_route');
    expect(updated?.departureTime).toBeDefined();
  });
});
