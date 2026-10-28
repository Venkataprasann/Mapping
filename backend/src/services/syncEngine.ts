import {
  Trip,
  Participant,
  GroupSyncAnalysis,
  SyncRecommendation,
  TripEventNotification
} from '../../../shared/types.js';

export interface SyncEngineOptions {
  bufferSeconds?: number; // Configurable departure buffer (default: 120s / 2m)
  fluctuationThresholdSeconds?: number; // Damping threshold for alerts (default: 180s / 3m)
  currentTime?: Date; // Allows deterministic simulation in tests
}

export class SyncEngine {
  /**
   * Performs real-time synchronization analysis across all participants in a trip.
   */
  public analyzeTripSynchronization(
    trip: Trip,
    options: SyncEngineOptions = {}
  ): GroupSyncAnalysis {
    const now = options.currentTime || new Date();
    const nowMs = now.getTime();
    const bufferSeconds = options.bufferSeconds ?? 120; // 2 minutes default buffer
    const toleranceSeconds = (trip.arrivalToleranceMinutes || 5) * 60;

    const participants = trip.participants || [];
    if (participants.length === 0) {
      return this.createEmptyAnalysis(trip.id, now);
    }

    // 1. Calculate remaining travel duration and earliest possible arrival for each participant
    const participantMetrics = participants.map((p) => {
      const remainingSeconds = this.calculateRemainingDuration(p, now);
      const earliestArrivalMs = nowMs + remainingSeconds * 1000;

      return {
        participant: p,
        remainingSeconds,
        earliestArrivalMs
      };
    });

    // 2. Resolve Target Arrival Time
    let targetArrivalMs: number;
    let isFixedTarget = false;

    if (trip.targetArrivalTime) {
      isFixedTarget = true;
      targetArrivalMs = new Date(trip.targetArrivalTime).getTime();
    } else {
      // Dynamic synchronization mode
      // If someone is already en_route, their predicted arrival anchors the group
      const enRouteMembers = participantMetrics.filter(m => m.participant.journeyStatus === 'en_route');
      if (enRouteMembers.length > 0) {
        targetArrivalMs = Math.max(...enRouteMembers.map(m => m.earliestArrivalMs));
      } else {
        // If everyone is not_started, target is when the person with the longest journey arrives
        const maxRemainingSeconds = Math.max(...participantMetrics.map(m => m.remainingSeconds));
        targetArrivalMs = nowMs + (maxRemainingSeconds + bufferSeconds) * 1000;
      }
    }

    // 3. Generate individual departure recommendations
    const recommendations: Record<string, SyncRecommendation> = {};
    const predictedArrivals: { id: string; name: string; arrivalMs: number }[] = [];

    for (const m of participantMetrics) {
      const p = m.participant;
      let recommendedDepartureMs: number;
      let predictedArrivalMs: number;
      let countdownSeconds: number;
      let urgency: 'wait' | 'prepare' | 'leave_now' | 'en_route' | 'arrived';
      let adviceMessage: string;

      if (p.journeyStatus === 'arrived') {
        recommendedDepartureMs = p.departureTime ? new Date(p.departureTime).getTime() : nowMs;
        predictedArrivalMs = nowMs;
        countdownSeconds = 0;
        urgency = 'arrived';
        adviceMessage = `${p.displayName} has arrived at the destination.`;
      } else if (p.journeyStatus === 'en_route') {
        recommendedDepartureMs = p.departureTime ? new Date(p.departureTime).getTime() : nowMs;
        predictedArrivalMs = nowMs + m.remainingSeconds * 1000;
        countdownSeconds = 0;
        urgency = 'en_route';
        adviceMessage = `${p.displayName} is en route. ETA: ${this.formatTime(new Date(predictedArrivalMs))}.`;
      } else {
        // 'not_started' or 'paused'
        recommendedDepartureMs = targetArrivalMs - (m.remainingSeconds + bufferSeconds) * 1000;
        countdownSeconds = Math.floor((recommendedDepartureMs - nowMs) / 1000);

        if (countdownSeconds <= 0) {
          // Late or leave immediately
          urgency = 'leave_now';
          predictedArrivalMs = nowMs + m.remainingSeconds * 1000;
          const lateByMins = Math.abs(Math.floor(countdownSeconds / 60));
          adviceMessage = lateByMins > 0
            ? `Leave immediately! Running ~${lateByMins}m behind synchronization schedule.`
            : 'Departure window reached. Time to start your journey now!';
        } else if (countdownSeconds <= 180) {
          urgency = 'prepare';
          predictedArrivalMs = recommendedDepartureMs + m.remainingSeconds * 1000;
          adviceMessage = `Prepare to depart in ${Math.ceil(countdownSeconds / 60)} minutes.`;
        } else {
          urgency = 'wait';
          predictedArrivalMs = recommendedDepartureMs + m.remainingSeconds * 1000;
          const waitMins = Math.floor(countdownSeconds / 60);
          adviceMessage = `Relax! You are closer to the destination. Recommended departure in ${waitMins} minutes.`;
        }
      }

      recommendations[p.id] = {
        participantId: p.id,
        displayName: p.displayName,
        recommendedDepartureTime: new Date(recommendedDepartureMs).toISOString(),
        predictedArrivalTime: new Date(predictedArrivalMs).toISOString(),
        countdownSeconds,
        urgency,
        travelDurationFormatted: `${Math.round(p.durationSeconds / 60)} mins`,
        distanceFormatted: `${(p.distanceMeters / 1000).toFixed(1)} km`,
        adviceMessage
      };

      predictedArrivals.push({
        id: p.id,
        name: p.displayName,
        arrivalMs: predictedArrivalMs
      });
    }

    // 4. Calculate Group Arrival Gap & Tolerance Check
    predictedArrivals.sort((a, b) => a.arrivalMs - b.arrivalMs);
    const earliest = predictedArrivals[0];
    const latest = predictedArrivals[predictedArrivals.length - 1];

    const arrivalGapSeconds = Math.max(0, Math.floor((latest.arrivalMs - earliest.arrivalMs) / 1000));
    const arrivalGapMinutes = Math.round(arrivalGapSeconds / 60);
    let isOnTrack = arrivalGapSeconds <= toleranceSeconds;

    let threatLevel: 'optimal' | 'moderate_gap' | 'high_delay_threat' = 'optimal';
    if (!isOnTrack) {
      threatLevel = arrivalGapSeconds > toleranceSeconds * 2 ? 'high_delay_threat' : 'moderate_gap';
    }

    // If fixed target and anyone arrives after the target + tolerance, flag threat
    if (isFixedTarget) {
      const overdueMembers = participantMetrics.filter(m => m.earliestArrivalMs > targetArrivalMs + toleranceSeconds * 1000);
      if (overdueMembers.length > 0) {
        threatLevel = 'high_delay_threat';
        isOnTrack = false;
      }
    }

    return {
      tripId: trip.id,
      targetArrivalTime: new Date(targetArrivalMs).toISOString(),
      isFixedTarget,
      earliestArrivalParticipant: earliest.name,
      latestArrivalParticipant: latest.name,
      arrivalGapSeconds,
      arrivalGapFormatted: arrivalGapMinutes === 0
        ? '0 mins (Synchronized)'
        : `${arrivalGapMinutes} mins gap`,
      isOnTrack,
      toleranceMinutes: trip.arrivalToleranceMinutes || 5,
      threatLevel,
      recommendations,
      lastCalculatedAt: now.toISOString()
    };
  }

  /**
   * Evaluates if changes between successive sync passes warrant a notification.
   * Damps fluctuations under 3 minutes to avoid user notification fatigue.
   */
  public evaluateNotificationEvents(
    trip: Trip,
    currentAnalysis: GroupSyncAnalysis,
    previousAnalysis?: GroupSyncAnalysis,
    fluctuationThresholdSeconds = 180
  ): TripEventNotification[] {
    const notifications: TripEventNotification[] = [];
    const now = new Date().toISOString();

    for (const [partId, rec] of Object.entries(currentAnalysis.recommendations)) {
      const prevRec = previousAnalysis?.recommendations[partId];

      // 1. Leave Now trigger (transitioned into leave_now)
      if (rec.urgency === 'leave_now' && (!prevRec || prevRec.urgency !== 'leave_now')) {
        notifications.push({
          id: `notif-leave-${partId}-${Date.now()}`,
          tripId: trip.id,
          participantId: partId,
          type: 'leave_now',
          title: 'Time to Leave!',
          message: `${rec.displayName}: It's time to depart for ${trip.destinationName}. Current travel estimate is ${rec.travelDurationFormatted}.`,
          createdAt: now,
          read: false
        });
      }

      // 2. Meaningful ETA / Departure schedule change detection (anti-flapping damping >= 3 minutes)
      if (prevRec) {
        const prevDep = new Date(prevRec.recommendedDepartureTime).getTime();
        const currDep = new Date(rec.recommendedDepartureTime).getTime();
        const depDeltaSeconds = Math.abs(Math.floor((currDep - prevDep) / 1000));

        const prevArrival = new Date(prevRec.predictedArrivalTime).getTime();
        const currArrival = new Date(rec.predictedArrivalTime).getTime();
        const arrivalDeltaSeconds = Math.abs(Math.floor((currArrival - prevArrival) / 1000));

        if (arrivalDeltaSeconds >= fluctuationThresholdSeconds && currArrival > prevArrival) {
          const deltaMins = Math.round(arrivalDeltaSeconds / 60);
          notifications.push({
            id: `notif-traffic-arrival-${partId}-${Date.now()}`,
            tripId: trip.id,
            participantId: partId,
            type: 'delay_threat',
            title: 'Traffic Delay Detected',
            message: `Traffic conditions changed. ${rec.displayName}'s estimated arrival shifted by +${deltaMins} minutes.`,
            createdAt: now,
            read: false
          });
        } else if (depDeltaSeconds >= fluctuationThresholdSeconds) {
          const deltaMins = Math.round(depDeltaSeconds / 60);
          const departsEarlier = currDep < prevDep;
          notifications.push({
            id: `notif-traffic-dep-${partId}-${Date.now()}`,
            tripId: trip.id,
            participantId: partId,
            type: 'delay_threat',
            title: departsEarlier ? 'Depart Earlier Alert' : 'Departure Schedule Shifted',
            message: departsEarlier
              ? `Heavier traffic detected. Recommended departure for ${rec.displayName} shifted earlier by ${deltaMins} minutes.`
              : `Traffic cleared. Recommended departure for ${rec.displayName} shifted later by ${deltaMins} minutes.`,
            createdAt: now,
            read: false
          });
        }
      }
    }

    // 3. Group Sync Mismatch Threat
    if (!currentAnalysis.isOnTrack && previousAnalysis?.isOnTrack) {
      notifications.push({
        id: `notif-gap-${trip.id}-${Date.now()}`,
        tripId: trip.id,
        type: 'eta_gap_alert',
        title: 'Arrival Synchronization Gap Alert',
        message: `Arrival gap increased to ${currentAnalysis.arrivalGapFormatted}, exceeding your ${currentAnalysis.toleranceMinutes}-minute tolerance.`,
        createdAt: now,
        read: false
      });
    }

    return notifications;
  }

  private calculateRemainingDuration(participant: Participant, now: Date): number {
    if (participant.journeyStatus === 'arrived') {
      return 0;
    }

    if (participant.journeyStatus === 'en_route' && participant.departureTime) {
      // Calculate elapsed time
      const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - new Date(participant.departureTime).getTime()) / 1000));
      // Remaining duration is total duration minus elapsed, clamped at minimum 60s until arrived
      return Math.max(60, participant.durationSeconds - elapsedSeconds);
    }

    return participant.durationSeconds;
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private createEmptyAnalysis(tripId: string, now: Date): GroupSyncAnalysis {
    return {
      tripId,
      targetArrivalTime: now.toISOString(),
      isFixedTarget: false,
      earliestArrivalParticipant: 'None',
      latestArrivalParticipant: 'None',
      arrivalGapSeconds: 0,
      arrivalGapFormatted: '0 mins',
      isOnTrack: true,
      toleranceMinutes: 5,
      threatLevel: 'optimal',
      recommendations: {},
      lastCalculatedAt: now.toISOString()
    };
  }
}

export const syncEngine = new SyncEngine();
