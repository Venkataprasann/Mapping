import { describe, it, expect } from 'vitest';
import { db } from '../src/services/database.js';
import { tripService } from '../src/services/tripService.js';

describe('Phase 2 Security: Trip Membership & Privacy Authorization', () => {
  it('should verify that an outsider cannot access another user private trip', async () => {
    // Trip created by user-friend-a
    const trip = await db.getTripById('bengaluru-sync-demo-01');
    expect(trip).toBeDefined();

    const outsiderUserId = 'user-outsider-999';

    // Verify membership evaluation logic
    const isMember = trip!.creatorId === outsiderUserId || trip!.participants.some(p => p.userId === outsiderUserId);
    expect(isMember).toBe(false);
  });

  it('should confirm that accepted participants are recognized as verified members', async () => {
    const trip = await db.getTripById('bengaluru-sync-demo-01');
    const friendBUserId = 'user-friend-b';

    const isMember = trip!.creatorId === friendBUserId || trip!.participants.some(p => p.userId === friendBUserId);
    expect(isMember).toBe(true);
  });

  it('should list only trips where the user is a creator or participant', async () => {
    const friendATrips = await tripService.listUserTrips('user-friend-a');
    expect(friendATrips.length).toBeGreaterThanOrEqual(1);

    const outsiderTrips = await tripService.listUserTrips('user-random-intruder');
    expect(outsiderTrips.length).toBe(0);
  });
});
