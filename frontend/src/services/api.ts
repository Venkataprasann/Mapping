import { Trip, Participant, GroupSyncAnalysis } from '@shared/types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const userJson = localStorage.getItem('syncroute_user');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user.id) {
        headers['Authorization'] = `Bearer ${user.id}`;
        headers['x-user-id'] = user.id;
      }
    } catch {
      // ignore JSON parse error
    }
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    return res.json();
  },

  async signup(data: { email: string; password: string; displayName: string; locationSharingEnabled?: boolean }) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Signup failed');
    }
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) return null;
    return res.json();
  },

  // Trips
  async createTrip(data: {
    title: string;
    destinationName: string;
    destinationAddress: string;
    destinationCoordinates: { lat: number; lng: number };
    targetArrivalTime?: string;
    arrivalToleranceMinutes?: number;
    startLocationName: string;
    startCoordinates: { lat: number; lng: number };
  }): Promise<{ trip: Trip }> {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create trip');
    }
    return res.json();
  },

  async getTrip(tripId: string): Promise<{ trip: Trip }> {
    const res = await fetch(`${API_BASE}/trips/${tripId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to load trip');
    }
    return res.json();
  },

  async getTripSync(tripId: string): Promise<{ analysis: GroupSyncAnalysis }> {
    const res = await fetch(`${API_BASE}/trips/${tripId}/sync`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to calculate trip sync');
    }
    return res.json();
  },

  async getTripByInvite(code: string): Promise<{ trip: Partial<Trip> }> {
    const res = await fetch(`${API_BASE}/trips/invite/${code}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Invalid or expired invite code');
    }
    return res.json();
  },

  async joinTrip(data: {
    inviteCodeOrToken: string;
    displayName: string;
    startLocationName: string;
    startCoordinates: { lat: number; lng: number };
    isSharingLocation?: boolean;
  }): Promise<{ trip: Trip; participant: Participant }> {
    const res = await fetch(`${API_BASE}/trips/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to join trip');
    }
    return res.json();
  },

  async listUserTrips(): Promise<{ trips: Trip[] }> {
    const res = await fetch(`${API_BASE}/trips`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      return { trips: [] };
    }
    return res.json();
  },

  async updateLocation(tripId: string, participantId: string, coords: { lat: number; lng: number }) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/participants/${participantId}/location`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(coords)
    });
    return res.json();
  },

  async updateStatus(tripId: string, participantId: string, journeyStatus: string) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/participants/${participantId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ journeyStatus })
    });
    return res.json();
  },

  async toggleLocationSharing(tripId: string, participantId: string, isSharingLocation: boolean) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/participants/${participantId}/sharing`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isSharingLocation })
    });
    return res.json();
  },

  async leaveTrip(tripId: string, participantId: string) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/participants/${participantId}/leave`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async sendVoiceCommand(message: string, tripId?: string): Promise<{ reply: string; executedTools: any[] }> {
    const res = await fetch(`${API_BASE}/voice/command`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, tripId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Voice command failed');
    }
    return res.json();
  }
};
