import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Trip, GroupSyncAnalysis, TripEventNotification, Coordinates } from '@shared/types';
import { api } from '@/services/api';

export interface UseRealtimeTripResult {
  trip: Trip | null;
  syncAnalysis: GroupSyncAnalysis | null;
  notifications: TripEventNotification[];
  isConnected: boolean;
  isTrackingGps: boolean;
  gpsError: string | null;
  startGpsTracking: (participantId: string) => void;
  stopGpsTracking: () => void;
  emitLocationUpdate: (participantId: string, coords: Coordinates) => void;
  emitStatusUpdate: (participantId: string, status: 'not_started' | 'en_route' | 'arrived' | 'paused') => void;
  emitSharingToggle: (participantId: string, isSharing: boolean) => void;
  dismissNotification: (id: string) => void;
}

export function useRealtimeTrip(
  tripId: string,
  initialTrip?: Trip,
  initialAnalysis?: GroupSyncAnalysis
): UseRealtimeTripResult {
  const [trip, setTrip] = useState<Trip | null>(initialTrip || null);
  const [syncAnalysis, setSyncAnalysis] = useState<GroupSyncAnalysis | null>(initialAnalysis || null);
  const [notifications, setNotifications] = useState<TripEventNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTrackingGps, setIsTrackingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!tripId) return;

    // Connect to the backend
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_trip', tripId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('trip_updated', (updatedTrip: Trip) => {
      setTrip(updatedTrip);
    });

    socket.on('sync_updated', (updatedSync: GroupSyncAnalysis) => {
      setSyncAnalysis(updatedSync);
    });

    socket.on('notification_received', (notif: TripEventNotification) => {
      setNotifications(prev => [notif, ...prev]);

      // Trigger Web Browser Notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notif.title, {
          body: notif.message,
          icon: '/favicon.ico'
        });
      }
    });

    // Cleanup
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      socket.emit('leave_trip', tripId);
      socket.disconnect();
    };
  }, [tripId]);

  // Request browser Web Push notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        // user declined or browser disallowed
      });
    }
  }, []);

  // Browser Geolocation tracking
  const startGpsTracking = useCallback((participantId: string) => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsError(null);
    setIsTrackingGps(true);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: Coordinates = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        // Emit over socket
        if (socketRef.current && isConnected) {
          socketRef.current.emit('location_update', {
            tripId,
            participantId,
            coords
          });
        }
      },
      (err) => {
        setIsTrackingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location permission denied. You can still test with simulated movements.');
        } else {
          setGpsError(`GPS signal unavailable (${err.message}).`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    watchIdRef.current = watchId;
  }, [tripId, isConnected]);

  const stopGpsTracking = useCallback(() => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTrackingGps(false);
  }, []);

  const emitLocationUpdate = useCallback((participantId: string, coords: Coordinates) => {
    if (socketRef.current) {
      socketRef.current.emit('location_update', { tripId, participantId, coords });
    }
  }, [tripId]);

  const emitStatusUpdate = useCallback((participantId: string, status: 'not_started' | 'en_route' | 'arrived' | 'paused') => {
    if (socketRef.current) {
      socketRef.current.emit('status_update', { tripId, participantId, status });
    }
  }, [tripId]);

  const emitSharingToggle = useCallback((participantId: string, isSharing: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit('sharing_update', { tripId, participantId, isSharing });
    }
  }, [tripId]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    trip,
    syncAnalysis,
    notifications,
    isConnected,
    isTrackingGps,
    gpsError,
    startGpsTracking,
    stopGpsTracking,
    emitLocationUpdate,
    emitStatusUpdate,
    emitSharingToggle,
    dismissNotification
  };
}
