import { describe, it, expect, beforeEach } from 'vitest';
import { notificationService } from '../src/services/notificationService.js';
import { Trip } from '../../../shared/types.js';

describe('Phase 5: Real-Time Trip Updates & Notification Cooldowns', () => {
  beforeEach(() => {
    notificationService.resetCooldowns();
  });

  const sampleTrip: Trip = {
    id: 'test-notif-trip-01',
    creatorId: 'user-a',
    title: 'Dinner at Indiranagar',
    destinationName: 'Toit Brewpub, Indiranagar',
    destinationAddress: '100 Feet Rd, Indiranagar, Bengaluru',
    destinationCoordinates: { lat: 12.9784, lng: 77.6408 },
    arrivalToleranceMinutes: 5,
    status: 'active',
    inviteCode: 'NOTIF1',
    inviteToken: 'tok-notif-1',
    inviteExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    participants: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('1. Dispatches Leave Now notification on first trigger', async () => {
    const notif = await notificationService.notifyLeaveNow(
      sampleTrip,
      'part-01',
      'Friend A',
      '45 mins'
    );

    expect(notif).toBeDefined();
    expect(notif?.type).toBe('leave_now');
    expect(notif?.title).toBe('Time to Leave!');
    expect(notif?.message).toContain('Friend A');
  });

  it('2. Suppresses duplicate notification within the 5-minute cooldown window', async () => {
    // First dispatch succeeds
    const firstNotif = await notificationService.notifyLeaveNow(
      sampleTrip,
      'part-01',
      'Friend A',
      '45 mins'
    );
    expect(firstNotif).not.toBeNull();

    // Second dispatch within cooldown (default 300s) is blocked
    const duplicateNotif = await notificationService.notifyLeaveNow(
      sampleTrip,
      'part-01',
      'Friend A',
      '45 mins'
    );
    expect(duplicateNotif).toBeNull();
  });

  it('3. Allows notification for a different participant or different event type', async () => {
    // Participant 1 Leave Now
    await notificationService.notifyLeaveNow(sampleTrip, 'part-01', 'Friend A', '45 mins');

    // Participant 2 Leave Now (different participant -> allowed)
    const part2Notif = await notificationService.notifyLeaveNow(sampleTrip, 'part-02', 'Friend B', '25 mins');
    expect(part2Notif).not.toBeNull();
    expect(part2Notif?.participantId).toBe('part-02');

    // Participant 1 Arrival Gap Threat (different event type -> allowed)
    const gapNotif = await notificationService.notifyArrivalGapThreat(sampleTrip, '12 mins gap', 5);
    expect(gapNotif).not.toBeNull();
    expect(gapNotif?.type).toBe('eta_gap_alert');
  });

  it('4. Dispatches arrival announcement when participant marks arrived', async () => {
    const arrivedNotif = await notificationService.notifyParticipantArrived(sampleTrip, 'part-02', 'Friend B');
    expect(arrivedNotif).not.toBeNull();
    expect(arrivedNotif?.type).toBe('participant_arrived');
    expect(arrivedNotif?.message).toContain('reached');
  });
});
