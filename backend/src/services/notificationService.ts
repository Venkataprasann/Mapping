import { TripEventNotification, Trip } from '../../../shared/types.js';
import { io } from '../server.js';
import { db } from './database.js';

export interface NotificationPayload {
  tripId: string;
  participantId?: string;
  type: TripEventNotification['type'];
  title: string;
  message: string;
  cooldownSeconds?: number;
}

export class NotificationService {
  // In-memory cooldown tracker: dedupKey -> timestamp in ms
  private cooldowns: Map<string, number> = new Map();

  /**
   * Dispatches a notification if the cooldown period has elapsed.
   * Prevents repeated or flapping notifications within the configured window.
   */
  public async dispatchNotification(payload: NotificationPayload): Promise<TripEventNotification | null> {
    const cooldownSeconds = payload.cooldownSeconds ?? 300; // 5-minute default cooldown
    const dedupKey = `${payload.tripId}:${payload.participantId || 'all'}:${payload.type}`;
    const nowMs = Date.now();

    // Check cooldown
    const lastSentMs = this.cooldowns.get(dedupKey);
    if (lastSentMs && nowMs - lastSentMs < cooldownSeconds * 1000) {
      // Cooldown active, suppress duplicate notification
      return null;
    }

    // Record cooldown
    this.cooldowns.set(dedupKey, nowMs);

    const notification: TripEventNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tripId: payload.tripId,
      participantId: payload.participantId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      createdAt: new Date().toISOString(),
      read: false
    };

    // Broadcast in real-time to the trip room via Socket.IO
    if (io) {
      io.to(`trip:${payload.tripId}`).emit('notification_received', notification);
    }

    return notification;
  }

  /**
   * Dispatches a "Leave Now!" notification for a participant
   */
  public async notifyLeaveNow(trip: Trip, participantId: string, displayName: string, travelDuration: string) {
    return this.dispatchNotification({
      tripId: trip.id,
      participantId,
      type: 'leave_now',
      title: 'Time to Leave!',
      message: `${displayName}: It's time to depart for ${trip.destinationName}. Current travel duration is ${travelDuration}.`
    });
  }

  /**
   * Dispatches an alert when arrival gap exceeds tolerance
   */
  public async notifyArrivalGapThreat(trip: Trip, gapFormatted: string, toleranceMins: number) {
    return this.dispatchNotification({
      tripId: trip.id,
      type: 'eta_gap_alert',
      title: 'Arrival Synchronization Mismatch',
      message: `The group arrival gap has increased to ${gapFormatted}, exceeding your ${toleranceMins}-minute tolerance limit.`
    });
  }

  /**
   * Dispatches an arrival announcement
   */
  public async notifyParticipantArrived(trip: Trip, participantId: string, displayName: string) {
    return this.dispatchNotification({
      tripId: trip.id,
      participantId,
      type: 'participant_arrived',
      title: 'Friend Arrived',
      message: `${displayName} has reached ${trip.destinationName}!`
    });
  }

  /**
   * Clear cooldowns for testing
   */
  public resetCooldowns() {
    this.cooldowns.clear();
  }
}

export const notificationService = new NotificationService();
