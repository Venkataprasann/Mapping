import { db } from './database.js';
import { Trip, Participant, JourneyStatus } from '../../../shared/types.js';

export interface CreateTripDTO {
  creatorId: string;
  creatorName: string;
  title: string;
  destinationName: string;
  destinationAddress: string;
  destinationCoordinates: { lat: number; lng: number };
  targetArrivalTime?: string;
  arrivalToleranceMinutes?: number;
  startLocationName: string;
  startCoordinates: { lat: number; lng: number };
}

export interface JoinTripDTO {
  inviteCodeOrToken: string;
  userId: string;
  displayName: string;
  startLocationName: string;
  startCoordinates: { lat: number; lng: number };
  isSharingLocation: boolean;
}

export class TripService {
  async createTrip(data: CreateTripDTO): Promise<Trip> {
    // 1. Create base trip record
    const trip = await db.createTrip({
      creatorId: data.creatorId,
      title: data.title,
      destinationName: data.destinationName,
      destinationAddress: data.destinationAddress,
      destinationCoordinates: data.destinationCoordinates,
      targetArrivalTime: data.targetArrivalTime,
      arrivalToleranceMinutes: data.arrivalToleranceMinutes || 5,
      status: 'active',
      participants: []
    });

    // 2. Add creator as first participant
    // For Bengaluru scenario or default, estimate default duration
    const estimatedDurationSeconds = 55 * 60; // 55 mins default
    const distanceMeters = 21400;

    const creatorParticipant = await db.addParticipant(trip.id, {
      userId: data.creatorId,
      displayName: data.creatorName,
      startLocationName: data.startLocationName,
      startCoordinates: data.startCoordinates,
      currentCoordinates: data.startCoordinates,
      isSharingLocation: true,
      journeyStatus: 'not_started',
      recommendedDepartureTime: data.targetArrivalTime
        ? new Date(new Date(data.targetArrivalTime).getTime() - estimatedDurationSeconds * 1000).toISOString()
        : new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      predictedArrivalTime: data.targetArrivalTime || new Date(Date.now() + estimatedDurationSeconds * 1000).toISOString(),
      durationSeconds: estimatedDurationSeconds,
      distanceMeters: distanceMeters,
      trafficStatus: 'heavy',
      isDemo: true,
      lastLocationUpdate: new Date().toISOString()
    });

    const refreshedTrip = await db.getTripById(trip.id);
    return refreshedTrip || trip;
  }

  async getTripById(tripId: string): Promise<Trip | null> {
    return db.getTripById(tripId);
  }

  async getTripByInvite(codeOrToken: string): Promise<Trip | null> {
    return db.getTripByInviteCode(codeOrToken);
  }

  async joinTrip(data: JoinTripDTO): Promise<{ trip: Trip; participant: Participant }> {
    const trip = await db.getTripByInviteCode(data.inviteCodeOrToken);
    if (!trip) {
      throw new Error('Invalid or expired trip invitation code.');
    }

    // Default duration for second participant (e.g. Electronic City ~ 32 mins)
    const estimatedDuration = 32 * 60;
    const distance = 14200;

    const participant = await db.addParticipant(trip.id, {
      userId: data.userId,
      displayName: data.displayName,
      startLocationName: data.startLocationName,
      startCoordinates: data.startCoordinates,
      currentCoordinates: data.startCoordinates,
      isSharingLocation: data.isSharingLocation,
      journeyStatus: 'not_started',
      recommendedDepartureTime: trip.targetArrivalTime
        ? new Date(new Date(trip.targetArrivalTime).getTime() - estimatedDuration * 1000).toISOString()
        : new Date(Date.now() + 28 * 60 * 1000).toISOString(),
      predictedArrivalTime: trip.targetArrivalTime || new Date(Date.now() + estimatedDuration * 1000).toISOString(),
      durationSeconds: estimatedDuration,
      distanceMeters: distance,
      trafficStatus: 'moderate',
      isDemo: true,
      lastLocationUpdate: new Date().toISOString()
    });

    if (!participant) {
      throw new Error('Failed to join trip.');
    }

    const refreshedTrip = await db.getTripById(trip.id);
    return { trip: refreshedTrip!, participant };
  }

  async listUserTrips(userId: string): Promise<Trip[]> {
    return db.listTripsForUser(userId);
  }

  async updateLocation(
    tripId: string,
    participantId: string,
    coords: { lat: number; lng: number }
  ): Promise<Participant | null> {
    return db.updateParticipant(tripId, participantId, {
      currentCoordinates: coords,
      lastLocationUpdate: new Date().toISOString()
    });
  }

  async updateJourneyStatus(
    tripId: string,
    participantId: string,
    status: JourneyStatus
  ): Promise<Participant | null> {
    const updates: Partial<Participant> = {
      journeyStatus: status
    };
    if (status === 'en_route') {
      updates.departureTime = new Date().toISOString();
    }
    return db.updateParticipant(tripId, participantId, updates);
  }

  async toggleLocationSharing(
    tripId: string,
    participantId: string,
    isSharing: boolean
  ): Promise<Participant | null> {
    return db.updateParticipant(tripId, participantId, {
      isSharingLocation: isSharing
    });
  }

  async leaveTrip(tripId: string, participantId: string): Promise<boolean> {
    return db.removeParticipant(tripId, participantId);
  }
}

export const tripService = new TripService();
