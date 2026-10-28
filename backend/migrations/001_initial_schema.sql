-- ============================================================================
-- SyncRoute AI: Initial Database Schema with Row Level Security (RLS)
-- Supports multi-party real-time synchronized trips, participants, and alerts
-- ============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase auth.users or standalone auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    location_sharing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Trips Table
CREATE TYPE trip_status_enum AS ENUM ('planning', 'active', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    destination_lat DOUBLE PRECISION NOT NULL,
    destination_lng DOUBLE PRECISION NOT NULL,
    target_arrival_time TIMESTAMPTZ,
    arrival_tolerance_minutes INTEGER NOT NULL DEFAULT 5,
    status trip_status_enum NOT NULL DEFAULT 'active',
    invite_code VARCHAR(10) NOT NULL UNIQUE,
    invite_token TEXT NOT NULL UNIQUE,
    invite_expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast invite lookup
CREATE INDEX IF NOT EXISTS idx_trips_invite_code ON public.trips(invite_code);
CREATE INDEX IF NOT EXISTS idx_trips_creator_id ON public.trips(creator_id);

-- 3. Trip Participants Table
CREATE TYPE journey_status_enum AS ENUM ('not_started', 'en_route', 'arrived', 'paused');

CREATE TABLE IF NOT EXISTS public.trip_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    start_location_name TEXT NOT NULL,
    start_lat DOUBLE PRECISION NOT NULL,
    start_lng DOUBLE PRECISION NOT NULL,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    last_location_update TIMESTAMPTZ,
    is_sharing_location BOOLEAN NOT NULL DEFAULT TRUE,
    journey_status journey_status_enum NOT NULL DEFAULT 'not_started',
    departure_time TIMESTAMPTZ,
    recommended_departure_time TIMESTAMPTZ,
    predicted_arrival_time TIMESTAMPTZ,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    distance_meters INTEGER NOT NULL DEFAULT 0,
    traffic_status VARCHAR(20) DEFAULT 'normal',
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_trip_participant UNIQUE (trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_trip_id ON public.trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.trip_participants(user_id);

-- 4. Trip Event Notifications Table
CREATE TYPE trip_event_type_enum AS ENUM ('leave_now', 'eta_gap_alert', 'delay_threat', 'participant_arrived', 'status_change', 'location_paused');

CREATE TABLE IF NOT EXISTS public.trip_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.trip_participants(id) ON DELETE CASCADE,
    event_type trip_event_type_enum NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    dedup_key TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_trip_id ON public.trip_notifications(trip_id);
CREATE INDEX IF NOT EXISTS idx_notifications_dedup ON public.trip_notifications(trip_id, dedup_key, created_at);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- Enforce that only verified trip members can view or alter trip data
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all profiles, but edit only their own
CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Trips: Users can view trips if they created it OR are an accepted participant
CREATE POLICY "Users can view trips they participate in"
    ON public.trips FOR SELECT
    TO authenticated
    USING (
        creator_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.trip_participants
            WHERE trip_participants.trip_id = trips.id
            AND trip_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create trips"
    ON public.trips FOR INSERT
    TO authenticated
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their trips"
    ON public.trips FOR UPDATE
    TO authenticated
    USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their trips"
    ON public.trips FOR DELETE
    TO authenticated
    USING (creator_id = auth.uid());

-- Trip Participants: Only members of the trip can view other participants
CREATE POLICY "Trip members can view fellow participants"
    ON public.trip_participants FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_participants.trip_id
            AND (
                trips.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_participants AS tp
                    WHERE tp.trip_id = trip_participants.trip_id
                    AND tp.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Participants can update their own status and location"
    ON public.trip_participants FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Notifications: Only recipients or trip members can read notifications
CREATE POLICY "Trip members can view notifications"
    ON public.trip_notifications FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_notifications.trip_id
            AND (
                trips.creator_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.trip_participants
                    WHERE trip_participants.trip_id = trips.id
                    AND trip_participants.user_id = auth.uid()
                )
            )
        )
    );
