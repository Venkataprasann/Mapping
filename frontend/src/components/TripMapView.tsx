import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Car,
  RefreshCw,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';
import { Trip, Participant } from '@shared/types';
import { Badge } from './ui/Badge';
import { Loader } from '@googlemaps/js-api-loader';

interface TripMapViewProps {
  trip: Trip;
  participants: Participant[];
  isDemoMode?: boolean;
  onRefreshRoutes?: () => void;
}

export const TripMapView: React.FC<TripMapViewProps> = ({
  trip,
  participants,
  isDemoMode = true,
  onRefreshRoutes
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [googleMapInstance, setGoogleMapInstance] = useState<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'details'>('map');

  // Check if public Google Maps key is available
  const googleMapsKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_PUBLIC_KEY || '';

  // Calculate staleness for participant coordinates
  const getParticipantStaleness = (participant: Participant) => {
    if (!participant.lastLocationUpdate) return { isStale: false, ageLabel: 'Unknown' };
    const diffSeconds = Math.floor((Date.now() - new Date(participant.lastLocationUpdate).getTime()) / 1000);
    const diffMins = Math.floor(diffSeconds / 60);

    if (diffMins >= 2) {
      return { isStale: true, ageLabel: `${diffMins}m ago (Stale)` };
    }
    return { isStale: false, ageLabel: 'Live GPS (<1m ago)' };
  };

  // Attempt to load Google Maps JS API if client key is provided
  useEffect(() => {
    if (!googleMapsKey || isDemoMode || !mapRef.current) return;

    const loader = new Loader({
      apiKey: googleMapsKey,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });

    (loader as any).load().then((google: any) => {
      if (!mapRef.current) return;
      const map = new google.maps.Map(mapRef.current, {
        center: {
          lat: trip.destinationCoordinates.lat,
          lng: trip.destinationCoordinates.lng
        },
        zoom: 12,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#38414e' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#212a37' }]
          },
          {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9ca5b3' }]
          }
        ]
      });

      // Add Destination Marker
      new google.maps.Marker({
        position: {
          lat: trip.destinationCoordinates.lat,
          lng: trip.destinationCoordinates.lng
        },
        map,
        title: trip.destinationName,
        icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
      });

      // Add Participant Markers
      participants.forEach((p, idx) => {
        const coords = p.currentCoordinates || p.startCoordinates;
        new google.maps.Marker({
          position: { lat: coords.lat, lng: coords.lng },
          map,
          title: `${p.displayName} (${Math.round(p.durationSeconds / 60)} mins)`,
          icon: idx === 0
            ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            : 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png'
        });
      });

      setGoogleMapInstance(map);
    }).catch((err: any) => {
      setMapError('Google Maps API key not provided or restricted. Displaying high-precision vector routing simulator.');
    });
  }, [googleMapsKey, isDemoMode, trip, participants]);

  return (
    <div className="relative w-full h-[380px] sm:h-[440px] md:h-[480px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <Badge variant={isDemoMode || !googleMapsKey ? 'demo' : 'success'} dot size="sm">
            {isDemoMode || !googleMapsKey ? 'BENGALURU ROUTING MAP' : 'GOOGLE MAPS JS LIVE'}
          </Badge>
          <span className="hidden sm:inline-block text-[11px] bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-lg text-slate-300 border border-slate-700/60 font-medium shadow-sm">
            Destination: {trip.destinationName.split(',')[0]}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {onRefreshRoutes && (
            <button
              onClick={onRefreshRoutes}
              className="p-1.5 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer text-xs flex items-center gap-1.5 shadow-md"
              title="Recalculate Routes & Traffic"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Recalculate</span>
            </button>
          )}
        </div>
      </div>

      {/* Real Google Maps Container if enabled and key present */}
      {googleMapsKey && !isDemoMode && !mapError ? (
        <div ref={mapRef} className="w-full h-full" />
      ) : (
        /* High-Precision Interactive Vector Map Canvas */
        <div className="relative flex-1 w-full bg-[#0b1120] overflow-hidden flex items-center justify-center select-none">
          {/* Subtle grid pattern resembling digital mapping vector tiles */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#1e293b 1px, #0b1120 1px)`,
              backgroundSize: '40px 40px',
              backgroundPosition: '0 0, 20px 20px'
            }}
          />

          {/* Bengaluru City Landmarks SVG Route Polylines */}
          <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 800 500">
            <defs>
              <linearGradient id="routeWhitefield" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="routeElectronicCity" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="1" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
              </filter>
            </defs>

            {/* Arterial Road Network Overlay */}
            <path d="M 80 180 Q 250 180 410 260 T 720 380" stroke="#1e293b" strokeWidth="6" fill="none" />
            <path d="M 180 470 Q 320 360 410 260 T 620 90" stroke="#1e293b" strokeWidth="6" fill="none" />
            <path d="M 120 70 Q 410 140 410 260 T 430 460" stroke="#1e293b" strokeWidth="4" fill="none" />

            {/* Route 1: Whitefield (top-right ~ 660, 130) -> Koramangala (center ~ 410, 260) */}
            <path
              d="M 660 130 C 580 140, 520 200, 410 260"
              stroke="url(#routeWhitefield)"
              strokeWidth="5"
              strokeDasharray="6 3"
              fill="none"
              filter="url(#glow)"
              className="animate-pulse"
            />

            {/* Route 2: Electronic City (bottom-center ~ 330, 420) -> Koramangala (center ~ 410, 260) */}
            <path
              d="M 330 420 C 340 350, 370 310, 410 260"
              stroke="url(#routeElectronicCity)"
              strokeWidth="5"
              fill="none"
              filter="url(#glow)"
            />
          </svg>

          {/* Destination Pin: Nexus Mall Koramangala */}
          <div
            className="absolute z-10 flex flex-col items-center pointer-events-auto transform -translate-x-1/2 -translate-y-full"
            style={{ left: '51%', top: '52%' }}
          >
            <div className="bg-rose-500 text-white p-2.5 rounded-full shadow-lg shadow-rose-500/50 animate-bounce">
              <MapPin className="w-5 h-5 fill-current" />
            </div>
            <div className="bg-slate-900/95 text-[11px] font-bold text-white px-2.5 py-1 rounded-md border border-rose-500/40 shadow-xl mt-1 whitespace-nowrap">
              {trip.destinationName.split(',')[0]}
            </div>
          </div>

          {/* Participant 1 Pin: Friend A (Whitefield) */}
          {participants[0] && (
            <div
              className="absolute z-10 flex flex-col items-center pointer-events-auto transform -translate-x-1/2 -translate-y-full group cursor-pointer"
              style={{ left: '82%', top: '26%' }}
            >
              <div className="bg-blue-500 text-white p-2 rounded-full shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform">
                <Car className="w-4 h-4" />
              </div>
              <div className="bg-slate-900/95 text-[11px] text-blue-300 px-2.5 py-0.5 rounded-md border border-blue-500/40 shadow-xl mt-1 whitespace-nowrap space-y-0.5">
                <div className="font-semibold">{participants[0].displayName} • {Math.round(participants[0].durationSeconds / 60)}m</div>
                {getParticipantStaleness(participants[0]).isStale ? (
                  <div className="text-[9px] text-amber-400 flex items-center gap-0.5 font-medium">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {getParticipantStaleness(participants[0]).ageLabel}
                  </div>
                ) : (
                  <div className="text-[9px] text-emerald-400 font-medium">
                    ● {getParticipantStaleness(participants[0]).ageLabel}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Participant 2 Pin: Friend B (Electronic City) */}
          {participants[1] && (
            <div
              className="absolute z-10 flex flex-col items-center pointer-events-auto transform -translate-x-1/2 -translate-y-full group cursor-pointer"
              style={{ left: '41%', top: '84%' }}
            >
              <div className="bg-purple-500 text-white p-2 rounded-full shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                <Car className="w-4 h-4" />
              </div>
              <div className="bg-slate-900/95 text-[11px] text-purple-300 px-2.5 py-0.5 rounded-md border border-purple-500/40 shadow-xl mt-1 whitespace-nowrap space-y-0.5">
                <div className="font-semibold">{participants[1].displayName} • {Math.round(participants[1].durationSeconds / 60)}m</div>
                <div className="text-[9px] text-emerald-400 font-medium">
                  ● {getParticipantStaleness(participants[1]).ageLabel}
                </div>
              </div>
            </div>
          )}

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1.5 shadow-lg">
            <div className="font-semibold text-slate-300 mb-0.5">Traffic Routes</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-blue-400 rounded-full" />
              <span className="text-slate-300">Whitefield (Heavy Traffic • 55m • 21.4km)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-purple-400 rounded-full" />
              <span className="text-slate-300">Electronic City (Tollway • 32m • 14.2km)</span>
            </div>
          </div>

          {/* Google Routes API & Places API Ready Status */}
          <div className="absolute bottom-3 right-3 z-20 text-[10px] text-slate-400 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Google Maps Routes &amp; Places Ready</span>
          </div>
        </div>
      )}
    </div>
  );
};
