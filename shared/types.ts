export type TripStatus = 'planning' | 'active' | 'completed' | 'cancelled';

export type JourneyStatus = 'not_started' | 'en_route' | 'arrived' | 'paused';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Participant {
  id: string;
  tripId: string;
  userId?: string;
  displayName: string;
  avatarUrl?: string;
  startLocationName: string;
  startCoordinates: Coordinates;
  currentCoordinates?: Coordinates;
  lastLocationUpdate?: string; // ISO string
  isSharingLocation: boolean;
  journeyStatus: JourneyStatus;
  departureTime?: string; // ISO string
  recommendedDepartureTime?: string; // ISO string
  predictedArrivalTime?: string; // ISO string
  durationSeconds: number; // travel duration in seconds
  distanceMeters: number;
  polyline?: string; // encoded route polyline or geo points
  trafficStatus?: 'normal' | 'moderate' | 'heavy' | 'unknown';
  isDemo?: boolean;
}

export interface Trip {
  id: string;
  creatorId: string;
  title: string;
  destinationName: string;
  destinationAddress: string;
  destinationCoordinates: Coordinates;
  targetArrivalTime?: string; // ISO string
  arrivalToleranceMinutes: number; // e.g. 5
  status: TripStatus;
  inviteCode: string; // e.g. "SR-8921"
  inviteToken: string;
  inviteExpiresAt: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface SyncRecommendation {
  participantId: string;
  displayName: string;
  recommendedDepartureTime: string; // ISO
  predictedArrivalTime: string; // ISO
  countdownSeconds: number; // seconds until departure (negative if overdue)
  urgency: 'wait' | 'prepare' | 'leave_now' | 'en_route' | 'arrived';
  travelDurationFormatted: string;
  distanceFormatted: string;
  adviceMessage: string;
}

export interface GroupSyncAnalysis {
  tripId: string;
  targetArrivalTime: string; // ISO
  isFixedTarget: boolean;
  earliestArrivalParticipant: string;
  latestArrivalParticipant: string;
  arrivalGapSeconds: number;
  arrivalGapFormatted: string;
  isOnTrack: boolean;
  toleranceMinutes: number;
  threatLevel: 'optimal' | 'moderate_gap' | 'high_delay_threat';
  recommendations: Record<string, SyncRecommendation>;
  lastCalculatedAt: string;
}

export interface TripEventNotification {
  id: string;
  tripId: string;
  participantId?: string;
  type: 'leave_now' | 'eta_gap_alert' | 'delay_threat' | 'participant_arrived' | 'status_change' | 'location_paused';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}
