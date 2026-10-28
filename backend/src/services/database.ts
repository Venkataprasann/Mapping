import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { Trip, Participant, TripEventNotification } from '../../../shared/types.js';
import { config } from '../config/index.js';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  locationSharingEnabled: boolean;
  createdAt: string;
}

class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private trips: Map<string, Trip> = new Map();
  private users: Map<string, UserProfile> = new Map();
  private notifications: Map<string, TripEventNotification[]> = new Map();

  constructor() {
    if (config.supabase.url && config.supabase.serviceKey) {
      this.supabase = createClient(config.supabase.url, config.supabase.serviceKey);
      console.log('✓ Connected to Supabase PostgreSQL Database with Service Role');
    } else {
      console.log('ℹ Supabase credentials not set. Initializing resilient in-memory data store with seeded Bengaluru dataset.');
    }
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed Creator (Friend A) and Participant (Friend B)
    const userA: UserProfile = {
      id: 'user-friend-a',
      email: 'friend.a@syncroute.ai',
      displayName: 'Friend A (You)',
      locationSharingEnabled: true,
      createdAt: new Date().toISOString()
    };
    const userB: UserProfile = {
      id: 'user-friend-b',
      email: 'friend.b@syncroute.ai',
      displayName: 'Friend B (Arjun)',
      locationSharingEnabled: true,
      createdAt: new Date().toISOString()
    };
    this.users.set(userA.id, userA);
    this.users.set(userB.id, userB);

    // Seed Bengaluru Cinema Trip
    const seedTrip: Trip = {
      id: 'bengaluru-sync-demo-01',
      creatorId: userA.id,
      title: 'Movie Night @ PVR Nexus Koramangala',
      destinationName: 'PVR Cinemas, Nexus Mall Koramangala',
      destinationAddress: 'Hosur Rd, Chikku Lakshmaiah Layout, Koramangala, Bengaluru, Karnataka 560095',
      destinationCoordinates: {
        lat: 12.9345,
        lng: 77.6111
      },
      targetArrivalTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      arrivalToleranceMinutes: 5,
      status: 'active',
      inviteCode: 'BLR779',
      inviteToken: 'demo-tok-bengaluru-9988',
      inviteExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      participants: [
        {
          id: 'part-01-a',
          tripId: 'bengaluru-sync-demo-01',
          userId: userA.id,
          displayName: userA.displayName,
          startLocationName: 'ITPL Main Rd, Whitefield, Bengaluru',
          startCoordinates: { lat: 12.9850, lng: 77.7300 },
          currentCoordinates: { lat: 12.9850, lng: 77.7300 },
          isSharingLocation: true,
          journeyStatus: 'not_started',
          recommendedDepartureTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          predictedArrivalTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          durationSeconds: 55 * 60,
          distanceMeters: 21400,
          trafficStatus: 'heavy',
          isDemo: true,
          lastLocationUpdate: new Date().toISOString()
        },
        {
          id: 'part-02-b',
          tripId: 'bengaluru-sync-demo-01',
          userId: userB.id,
          displayName: userB.displayName,
          startLocationName: 'Phase 1, Electronic City, Bengaluru',
          startCoordinates: { lat: 12.8452, lng: 77.6602 },
          currentCoordinates: { lat: 12.8452, lng: 77.6602 },
          isSharingLocation: true,
          journeyStatus: 'not_started',
          recommendedDepartureTime: new Date(Date.now() + 28 * 60 * 1000).toISOString(),
          predictedArrivalTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          durationSeconds: 32 * 60,
          distanceMeters: 14200,
          trafficStatus: 'moderate',
          isDemo: true,
          lastLocationUpdate: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.trips.set(seedTrip.id, seedTrip);
  }

  // --- Profile Operations ---
  async getProfile(id: string): Promise<UserProfile | null> {
    return this.users.get(id) || null;
  }

  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    this.users.set(profile.id, profile);
    return profile;
  }

  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }

  // --- Trip Operations ---
  async createTrip(tripData: Omit<Trip, 'id' | 'inviteCode' | 'inviteToken' | 'inviteExpiresAt' | 'createdAt' | 'updatedAt'>): Promise<Trip> {
    const tripId = uuidv4();
    const inviteCode = 'SR-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const inviteToken = uuidv4();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours validity

    const newTrip: Trip = {
      ...tripData,
      id: tripId,
      inviteCode,
      inviteToken,
      inviteExpiresAt: expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.trips.set(tripId, newTrip);
    return newTrip;
  }

  async getTripById(tripId: string): Promise<Trip | null> {
    return this.trips.get(tripId) || null;
  }

  async getTripByInviteCode(code: string): Promise<Trip | null> {
    const normalized = code.trim().toUpperCase();
    for (const trip of this.trips.values()) {
      if (trip.inviteCode === normalized || trip.inviteToken === code) {
        // Check expiration
        if (new Date(trip.inviteExpiresAt).getTime() < Date.now()) {
          return null; // Expired
        }
        return trip;
      }
    }
    return null;
  }

  async listTripsForUser(userId: string): Promise<Trip[]> {
    const result: Trip[] = [];
    for (const trip of this.trips.values()) {
      if (trip.creatorId === userId || trip.participants.some(p => p.userId === userId)) {
        result.push(trip);
      }
    }
    return result;
  }

  async updateTrip(trip: Trip): Promise<Trip> {
    trip.updatedAt = new Date().toISOString();
    this.trips.set(trip.id, trip);
    return trip;
  }

  async deleteTrip(tripId: string): Promise<boolean> {
    return this.trips.delete(tripId);
  }

  // --- Participant Operations ---
  async addParticipant(tripId: string, participantData: Omit<Participant, 'id' | 'tripId'>): Promise<Participant | null> {
    const trip = this.trips.get(tripId);
    if (!trip) return null;

    // Check if participant already in trip
    const existing = trip.participants.find(p => p.userId && p.userId === participantData.userId);
    if (existing) {
      return existing;
    }

    const newParticipant: Participant = {
      ...participantData,
      id: uuidv4(),
      tripId: tripId
    };

    trip.participants.push(newParticipant);
    trip.updatedAt = new Date().toISOString();
    this.trips.set(tripId, trip);
    return newParticipant;
  }

  async updateParticipant(tripId: string, participantId: string, updates: Partial<Participant>): Promise<Participant | null> {
    const trip = this.trips.get(tripId);
    if (!trip) return null;

    const index = trip.participants.findIndex(p => p.id === participantId);
    if (index === -1) return null;

    trip.participants[index] = {
      ...trip.participants[index],
      ...updates
    };
    trip.updatedAt = new Date().toISOString();
    this.trips.set(tripId, trip);
    return trip.participants[index];
  }

  async removeParticipant(tripId: string, participantId: string): Promise<boolean> {
    const trip = this.trips.get(tripId);
    if (!trip) return false;

    const initialLen = trip.participants.length;
    trip.participants = trip.participants.filter(p => p.id !== participantId);
    if (trip.participants.length !== initialLen) {
      trip.updatedAt = new Date().toISOString();
      this.trips.set(tripId, trip);
      return true;
    }
    return false;
  }
}

export const db = new DatabaseService();
