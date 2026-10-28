import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  Play,
  Pause,
  RotateCcw,
  Navigation,
  Clock,
  Car,
  MapPin,
  Sparkles,
  Layers,
  CheckCircle2,
  Key,
  X,
  Check,
  Search,
  Maximize2,
  ChevronDown,
  Bell,
  AlertTriangle,
  Volume2
} from 'lucide-react';
import { Trip, Participant, GroupSyncAnalysis } from '@shared/types';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import {
  BANGALORE_ORIGIN_LOCATIONS,
  BANGALORE_DESTINATIONS,
  POPULAR_BANGALORE_PLANS,
  BangaloreLocation
} from '@/constants/bangaloreLocations';
import {
  fetchBangaloreRoadRoute,
  searchBangaloreLocations,
  RoadRoute,
  SearchedLocation
} from '@/services/routingService';

interface RealisticGoogleMapProps {
  trip: Trip;
  participants: Participant[];
  syncAnalysis?: GroupSyncAnalysis;
  onSimulationUpdate?: (participantId: string, currentCoord: { lat: number; lng: number }, remainingSeconds: number) => void;
}

interface EqualSyncAlert {
  targetFriend: 'Friend A' | 'Friend B';
  farFriend: 'Friend A' | 'Friend B';
  equalMinutes: number;
  message: string;
}

// Audio chime using Web Audio API
function playSyncAlertChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Two-tone chime (A5 -> D6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.18);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.18);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // AudioContext might require user gesture in some browser configs
  }
}

// Speech synthesis alert
function speakAlert(text: string) {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    // Ignore speech error
  }
}

export const RealisticGoogleMap: React.FC<RealisticGoogleMapProps> = ({
  trip,
  participants,
  syncAnalysis,
  onSimulationUpdate
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Markers and Polylines layer refs
  const friendAMarkerRef = useRef<L.Marker | null>(null);
  const friendBMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const syncThresholdMarkerRef = useRef<L.Marker | null>(null);
  const polylineARef = useRef<L.Polyline | null>(null);
  const polylineBRef = useRef<L.Polyline | null>(null);

  // Locations state
  const [friendALoc, setFriendALoc] = useState<BangaloreLocation>(BANGALORE_ORIGIN_LOCATIONS[0]); // Whitefield (55 mins)
  const [friendBLoc, setFriendBLoc] = useState<BangaloreLocation>(BANGALORE_ORIGIN_LOCATIONS[5]); // Electronic City (32 mins)
  const [destLoc, setDestLoc] = useState<BangaloreLocation>(BANGALORE_DESTINATIONS[0]); // Nexus Koramangala
  const [activePlanId, setActivePlanId] = useState<string>('plan-1');

  // Real road routes computed from OSRM
  const [routeA, setRouteA] = useState<RoadRoute | null>(null);
  const [routeB, setRouteB] = useState<RoadRoute | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState<boolean>(false);

  // Simulation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 5>(2);
  const [stepA, setStepA] = useState(0);
  const [stepB, setStepB] = useState(0);
  const [mapStyle, setMapStyle] = useState<'streets' | 'dark' | 'satellite' | 'osm'>('streets');
  const [showLocationPlanner, setShowLocationPlanner] = useState(false);

  // Equal Distance/Time Departure Alert State
  const [equalSyncAlert, setEqualSyncAlert] = useState<EqualSyncAlert | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const alertTriggeredRef = useRef(false);

  // Search state for locations anywhere in Bangalore
  const [searchTarget, setSearchTarget] = useState<'friendA' | 'friendB' | 'dest' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedLocation[]>([]);

  // Google Maps API Key Modal state
  const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_PUBLIC_KEY || '';
  const [googleApiKey, setGoogleApiKey] = useState(() => localStorage.getItem('google_maps_api_key') || envKey);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(() => localStorage.getItem('google_maps_api_key') || envKey);

  // 1. Fetch Real Street-Snapped Routes when locations change
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingRoutes(true);

    Promise.all([
      fetchBangaloreRoadRoute(friendALoc, destLoc),
      fetchBangaloreRoadRoute(friendBLoc, destLoc)
    ]).then(([resA, resB]) => {
      if (isCancelled) return;
      setRouteA(resA);
      setRouteB(resB);
      setIsLoadingRoutes(false);
      setStepA(0);
      setStepB(0);
      setIsPlaying(false);
      setEqualSyncAlert(null);
      setAlertDismissed(false);
      alertTriggeredRef.current = false;
    });

    return () => {
      isCancelled = true;
    };
  }, [friendALoc, friendBLoc, destLoc]);

  // Derived durations and paths
  const pathA = routeA?.path || [friendALoc, destLoc];
  const pathB = routeB?.path || [friendBLoc, destLoc];
  const durationA = routeA?.durationMins || 55;
  const durationB = routeB?.durationMins || 32;

  const maxStepsA = Math.max(1, pathA.length - 1);
  const maxStepsB = Math.max(1, pathB.length - 1);

  // Find exact waypoint index along the farther friend's route where remaining time equals nearby friend's duration
  const syncThresholdPoint = useMemo(() => {
    if (durationA > durationB) {
      // Friend A is farther away; find point where remaining duration == durationB
      for (let i = 0; i <= maxStepsA; i++) {
        const remMins = Math.round(durationA * ((maxStepsA - i) / maxStepsA));
        if (remMins <= durationB && pathA[i]) {
          return {
            stepIndex: i,
            coord: pathA[i],
            targetFriend: 'Friend B' as const,
            farFriend: 'Friend A' as const,
            thresholdMins: durationB
          };
        }
      }
    } else if (durationB > durationA) {
      // Friend B is farther away; find point where remaining duration == durationA
      for (let i = 0; i <= maxStepsB; i++) {
        const remMins = Math.round(durationB * ((maxStepsB - i) / maxStepsB));
        if (remMins <= durationA && pathB[i]) {
          return {
            stepIndex: i,
            coord: pathB[i],
            targetFriend: 'Friend A' as const,
            farFriend: 'Friend B' as const,
            thresholdMins: durationA
          };
        }
      }
    }
    return null;
  }, [durationA, durationB, maxStepsA, maxStepsB, pathA, pathB]);

  // Synchronization departure calculations (target showtime 7:30 PM)
  const syncSchedule = useMemo(() => {
    const targetDate = new Date();
    targetDate.setHours(19, 30, 0, 0); // 7:30 PM

    const depDateA = new Date(targetDate.getTime() - durationA * 60 * 1000);
    const depDateB = new Date(targetDate.getTime() - durationB * 60 * 1000);

    const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const waitA = Math.max(0, durationB - durationA);
    const waitB = Math.max(0, durationA - durationB);

    return {
      targetTime: '7:30 PM',
      depTimeA: formatTime(depDateA),
      depTimeB: formatTime(depDateB),
      waitA,
      waitB,
      friendADepartsFirst: durationA >= durationB
    };
  }, [durationA, durationB]);

  // Live remaining durations based on animation step
  const remainingMinsA = Math.max(0, Math.round(durationA * ((maxStepsA - stepA) / maxStepsA)));
  const remainingMinsB = Math.max(0, Math.round(durationB * ((maxStepsB - stepB) / maxStepsB)));

  // Custom DivIcon generator with prominent timing and status
  const createHtmlIcon = (
    bgColor: string,
    label: string,
    timeText: string,
    subText: string,
    iconType: 'car' | 'dest' | 'sync',
    isMoving = false
  ) => {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="position: relative; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; pointer-events: auto;">
          <!-- Floating Time Badge always visible on marker -->
          <div style="background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); border: 2px solid ${bgColor}; border-radius: 12px; padding: 5px 10px; box-shadow: 0 10px 25px -4px rgba(0,0,0,0.7); margin-bottom: 7px; white-space: nowrap; text-align: center;">
            <div style="font-size: 11px; font-weight: 800; color: #ffffff; letter-spacing: -0.2px;">${label}</div>
            <div style="font-size: 11px; font-weight: 700; color: ${bgColor}; font-family: ui-monospace, monospace;">${timeText}</div>
            ${subText ? `<div style="font-size: 9px; font-weight: 500; color: #94a3b8;">${subText}</div>` : ''}
          </div>
          <!-- Vehicle / Pin Icon -->
          <div style="width: 38px; height: 38px; border-radius: 50%; background: ${bgColor}; box-shadow: 0 0 20px ${bgColor}; display: flex; align-items: center; justify-content: center; color: white; border: 2.5px solid #ffffff; ${isMoving ? 'animation: pulse 1.2s infinite;' : ''}">
            ${iconType === 'dest'
              ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
              : iconType === 'sync'
              ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
              : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>'
            }
          </div>
        </div>
      `,
      iconSize: [0, 0]
    });
  };

  // Initialize Leaflet Map with Google Maps-style free pan & drag
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      center: [12.9550, 77.6200],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      tapHold: false
    });

    map.dragging.enable();

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Tiles (Watermark-free Google Maps style)
    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
    let tileClassName = '';

    if (mapStyle === 'dark') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
      tileClassName = 'map-tiles-night';
    } else if (mapStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    } else if (mapStyle === 'osm') {
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      className: tileClassName
    }).addTo(map);

    // 1. Draw Route A along real road geometry
    const latLngsA = pathA.map(p => [p.lat, p.lng] as [number, number]);
    const polyA = L.polyline(latLngsA, {
      color: '#3b82f6',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false
    }).addTo(map);
    polylineARef.current = polyA;

    // 2. Draw Route B along real road geometry
    const latLngsB = pathB.map(p => [p.lat, p.lng] as [number, number]);
    const polyB = L.polyline(latLngsB, {
      color: '#a855f7',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false
    }).addTo(map);
    polylineBRef.current = polyB;

    // 3. Draw Equal-Distance Sync Milestone on the longer route
    if (syncThresholdPoint) {
      const thresholdMarker = L.marker([syncThresholdPoint.coord.lat, syncThresholdPoint.coord.lng], {
        icon: createHtmlIcon(
          '#f59e0b',
          '⚡ Equal Distance Trigger',
          `${syncThresholdPoint.thresholdMins}m from Destination`,
          `${syncThresholdPoint.targetFriend} Starts Here`,
          'sync'
        )
      }).addTo(map);
      syncThresholdMarkerRef.current = thresholdMarker;
    }

    // 4. Destination Pin
    const destMarker = L.marker([destLoc.lat, destLoc.lng], {
      icon: createHtmlIcon('#ef4444', destLoc.name.split(',')[0], 'Target: 7:30 PM', 'Sync Meetup Point', 'dest')
    }).addTo(map);
    destinationMarkerRef.current = destMarker;

    // 5. Friend A Pin with live timing attached
    const curA = pathA[Math.min(stepA, maxStepsA)];
    const timeTextA = stepA >= maxStepsA
      ? 'Arrived!'
      : syncSchedule.friendADepartsFirst || stepA > 0
      ? `${remainingMinsA}m rem. • ETA 7:30 PM`
      : `Wait ${syncSchedule.waitA}m • Departs ${syncSchedule.depTimeA}`;
    const subTextA = `From ${friendALoc.name.split('/')[0].trim()}`;

    const markerA = L.marker([curA.lat, curA.lng], {
      icon: createHtmlIcon('#38bdf8', 'Friend A', timeTextA, subTextA, 'car', isPlaying && stepA < maxStepsA)
    }).addTo(map);
    friendAMarkerRef.current = markerA;

    // 6. Friend B Pin with live timing attached
    const curB = pathB[Math.min(stepB, maxStepsB)];
    const timeTextB = stepB >= maxStepsB
      ? 'Arrived!'
      : !syncSchedule.friendADepartsFirst || stepB > 0
      ? `${remainingMinsB}m rem. • ETA 7:30 PM`
      : `Wait ${syncSchedule.waitB}m • Departs ${syncSchedule.depTimeB}`;
    const subTextB = `From ${friendBLoc.name.split('/')[0].trim()}`;

    const markerB = L.marker([curB.lat, curB.lng], {
      icon: createHtmlIcon('#c084fc', 'Friend B', timeTextB, subTextB, 'car', isPlaying && stepB < maxStepsB)
    }).addTo(map);
    friendBMarkerRef.current = markerB;

    // Fit view to active routes
    const bounds = L.latLngBounds([
      [friendALoc.lat, friendALoc.lng],
      [friendBLoc.lat, friendBLoc.lng],
      [destLoc.lat, destLoc.lng]
    ]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapStyle, friendALoc, friendBLoc, destLoc, pathA, pathB, syncThresholdPoint]);

  // Update marker positions & labels dynamically during simulation without rebuilding map
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (friendAMarkerRef.current && pathA[stepA]) {
      const curA = pathA[stepA];
      friendAMarkerRef.current.setLatLng([curA.lat, curA.lng]);
      const timeTextA = stepA >= maxStepsA
        ? 'Arrived!'
        : syncSchedule.friendADepartsFirst || stepA > 0
        ? `${remainingMinsA}m rem. • ETA 7:30 PM`
        : `Wait ${syncSchedule.waitA}m • Departs ${syncSchedule.depTimeA}`;
      friendAMarkerRef.current.setIcon(
        createHtmlIcon('#38bdf8', 'Friend A', timeTextA, `From ${friendALoc.name.split('/')[0].trim()}`, 'car', isPlaying && stepA < maxStepsA)
      );
    }

    if (friendBMarkerRef.current && pathB[stepB]) {
      const curB = pathB[stepB];
      friendBMarkerRef.current.setLatLng([curB.lat, curB.lng]);

      // If Friend B has started because Friend A reached equal distance:
      const isFriendBTriggered = Boolean(equalSyncAlert);
      const timeTextB = stepB >= maxStepsB
        ? 'Arrived!'
        : stepB > 0 || isFriendBTriggered
        ? `🚨 DEPART NOW! • ${remainingMinsB}m rem.`
        : !syncSchedule.friendADepartsFirst
        ? `${remainingMinsB}m rem. • ETA 7:30 PM`
        : `Wait • Starts when A is ${durationB}m away`;

      friendBMarkerRef.current.setIcon(
        createHtmlIcon('#c084fc', 'Friend B', timeTextB, `From ${friendBLoc.name.split('/')[0].trim()}`, 'car', isPlaying && stepB < maxStepsB)
      );
    }
  }, [stepA, stepB, remainingMinsA, remainingMinsB, isPlaying, equalSyncAlert]);

  // Live Drive Simulation Animation Loop with Equal Distance/Time Trigger
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      // 1. If Friend A is farther away (e.g. 55 mins vs 32 mins)
      if (durationA >= durationB) {
        // Friend A advances along Route A
        setStepA((prevA) => {
          const nextA = Math.min(prevA + 1, maxStepsA);
          const currentCoordA = pathA[nextA];
          const remSecsA = Math.round(durationA * 60 * ((maxStepsA - nextA) / maxStepsA));
          const remMinsA = Math.round(remSecsA / 60);

          // Check if Friend A's remaining distance/time to destination has dropped to equal Friend B's distance/time!
          if (remMinsA <= durationB && !alertTriggeredRef.current) {
            alertTriggeredRef.current = true;
            const alertData: EqualSyncAlert = {
              targetFriend: 'Friend B',
              farFriend: 'Friend A',
              equalMinutes: durationB,
              message: `Friend A has covered the extra distance and is now ${durationB} mins from ${destLoc.name.split(',')[0]}! Both friends now have the EXACT SAME time and distance to destination. Friend B: START YOUR JOURNEY NOW!`
            };
            setEqualSyncAlert(alertData);
            setAlertDismissed(false);
            playSyncAlertChime();
            speakAlert(`SyncRoute Alert! Friend A is now at equal distance. Friend B, start your journey now!`);
          }

          if (onSimulationUpdate && participants[0]) {
            onSimulationUpdate(participants[0].id, currentCoordA, remSecsA);
          }

          return nextA;
        });

        // Friend B starts ONLY when Friend A reaches equal distance threshold!
        setStepB((prevB) => {
          const currentRemMinsA = Math.round(durationA * ((maxStepsA - stepA) / maxStepsA));

          // If Friend A hasn't reached the equal distance point yet, Friend B waits at origin!
          if (currentRemMinsA > durationB && prevB === 0) {
            return 0; // Wait at home!
          }

          // Once equal distance is reached, Friend B drives simultaneously with Friend A!
          const nextB = Math.min(prevB + 1, maxStepsB);
          const currentCoordB = pathB[nextB];
          const remSecsB = Math.round(durationB * 60 * ((maxStepsB - nextB) / maxStepsB));

          if (onSimulationUpdate && participants[1]) {
            onSimulationUpdate(participants[1].id, currentCoordB, remSecsB);
          }

          return nextB;
        });
      }
      // 2. If Friend B is farther away (e.g. 50 mins vs 25 mins)
      else {
        // Friend B advances first
        setStepB((prevB) => {
          const nextB = Math.min(prevB + 1, maxStepsB);
          const currentCoordB = pathB[nextB];
          const remSecsB = Math.round(durationB * 60 * ((maxStepsB - nextB) / maxStepsB));
          const remMinsB = Math.round(remSecsB / 60);

          // Check if Friend B's remaining distance has dropped to equal Friend A's distance!
          if (remMinsB <= durationA && !alertTriggeredRef.current) {
            alertTriggeredRef.current = true;
            const alertData: EqualSyncAlert = {
              targetFriend: 'Friend A',
              farFriend: 'Friend B',
              equalMinutes: durationA,
              message: `Friend B has covered the extra distance and is now ${durationA} mins from ${destLoc.name.split(',')[0]}! Both friends now have the EXACT SAME time and distance to destination. Friend A: START YOUR JOURNEY NOW!`
            };
            setEqualSyncAlert(alertData);
            setAlertDismissed(false);
            playSyncAlertChime();
            speakAlert(`SyncRoute Alert! Friend B is now at equal distance. Friend A, start your journey now!`);
          }

          if (onSimulationUpdate && participants[1]) {
            onSimulationUpdate(participants[1].id, currentCoordB, remSecsB);
          }

          return nextB;
        });

        // Friend A starts when Friend B reaches equal distance threshold
        setStepA((prevA) => {
          const currentRemMinsB = Math.round(durationB * ((maxStepsA - stepB) / maxStepsA));

          if (currentRemMinsB > durationA && prevA === 0) {
            return 0; // Wait at home!
          }

          const nextA = Math.min(prevA + 1, maxStepsA);
          const currentCoordA = pathA[nextA];
          const remSecsA = Math.round(durationA * 60 * ((maxStepsA - nextA) / maxStepsA));

          if (onSimulationUpdate && participants[0]) {
            onSimulationUpdate(participants[0].id, currentCoordA, remSecsA);
          }

          return nextA;
        });
      }
    }, 450 / simSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed, stepA, stepB, maxStepsA, maxStepsB, pathA, pathB, durationA, durationB, destLoc]);

  // Handle Search Input Change
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    const results = await searchBangaloreLocations(val);
    setSearchResults(results);
  };

  const handleSelectSearchResult = (loc: SearchedLocation) => {
    const newLoc: BangaloreLocation = {
      id: loc.id,
      name: loc.name,
      zone: (loc.zone as any) || 'Central',
      lat: loc.lat,
      lng: loc.lng,
      description: loc.address
    };

    if (searchTarget === 'friendA') {
      setFriendALoc(newLoc);
    } else if (searchTarget === 'friendB') {
      setFriendBLoc(newLoc);
    } else if (searchTarget === 'dest') {
      setDestLoc(newLoc);
    }

    setSearchTarget(null);
    setSearchQuery('');
    setSearchResults([]);
    setActivePlanId('custom');
  };

  const handleFitWholeBangalore = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([12.9716, 77.5946], 11, { animate: true });
    }
  };

  const handleResetSimulation = () => {
    setIsPlaying(false);
    setStepA(0);
    setStepB(0);
    setEqualSyncAlert(null);
    setAlertDismissed(false);
    alertTriggeredRef.current = false;

    if (friendAMarkerRef.current && pathA[0]) {
      friendAMarkerRef.current.setLatLng([pathA[0].lat, pathA[0].lng]);
    }
    if (friendBMarkerRef.current && pathB[0]) {
      friendBMarkerRef.current.setLatLng([pathB[0].lat, pathB[0].lng]);
    }
  };

  const handleSelectPresetPlan = (plan: typeof POPULAR_BANGALORE_PLANS[0]) => {
    handleResetSimulation();
    setFriendALoc(plan.friendA);
    setFriendBLoc(plan.friendB);
    setDestLoc(plan.destination);
    setActivePlanId(plan.id);
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('google_maps_api_key', keyInput.trim());
    setGoogleApiKey(keyInput.trim());
    setShowKeyModal(false);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('google_maps_api_key');
    setGoogleApiKey('');
    setKeyInput('');
    setShowKeyModal(false);
  };

  // Difference in distance/time between friends
  const distDiffMins = Math.abs(durationA - durationB);
  const farFriendName = durationA >= durationB ? 'Friend A' : 'Friend B';
  const nearbyFriendName = durationA >= durationB ? 'Friend B' : 'Friend A';
  const thresholdMins = Math.min(durationA, durationB);

  // Minutes remaining until equal threshold is reached
  const minsUntilSyncThreshold = durationA >= durationB
    ? Math.max(0, remainingMinsA - durationB)
    : Math.max(0, remainingMinsB - durationA);

  const isThresholdTriggered = Boolean(equalSyncAlert) || minsUntilSyncThreshold === 0;

  return (
    <div className="relative w-full h-[540px] sm:h-[600px] md:h-[650px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* 1. Leaflet Map Viewport with Google Maps Hand Cursor */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full z-0 google-map-cursor"
        style={{ touchAction: 'none' }}
      />

      {/* 2. Top Header HUD: Synchronized Gap, Equal Distance Trigger Indicator & Planner Toggle */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Synchronized Gap Badge & Equal Distance Trigger Status */}
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            <div className="bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-emerald-500/40 text-xs font-semibold text-white flex items-center gap-2 shadow-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Synchronized Gap: <strong className="text-emerald-300 font-mono">0 mins</strong>
              </span>
              <span className="text-slate-400 text-[10px] hidden sm:inline">(Simultaneous Arrival)</span>
            </div>

            {/* Live Equal-Distance Status Pill */}
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-xl transition-all ${
              isThresholdTriggered
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 animate-pulse'
                : 'bg-slate-950/90 border-amber-500/40 text-amber-300'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isThresholdTriggered
                  ? `⚡ Equal Distance Reached (${thresholdMins}m): Both Converging`
                  : `${nearbyFriendName} Starts Late: ${minsUntilSyncThreshold}m until Equal Distance`}
              </span>
            </div>

            <button
              onClick={() => setShowLocationPlanner(!showLocationPlanner)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xl ${
                showLocationPlanner
                  ? 'bg-blue-600 border-blue-400 text-white shadow-blue-500/20'
                  : 'bg-slate-950/90 backdrop-blur-md border-blue-500/40 text-blue-300 hover:text-white hover:bg-blue-950/80'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Bangalore Locations</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLocationPlanner ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Right Toolbar: Map Styles & Attach Key */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={handleFitWholeBangalore}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-950/90 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition shadow-lg cursor-pointer flex items-center gap-1"
              title="View entire Bangalore metropolitan map"
            >
              <Maximize2 className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Whole Bangalore</span>
            </button>

            <button
              onClick={() => setShowKeyModal(true)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 shadow-lg cursor-pointer ${
                googleApiKey
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80'
                  : 'bg-slate-950/90 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{googleApiKey ? 'Key Attached ✓' : 'Attach API Key'}</span>
            </button>

            {/* Map Layer Switcher */}
            <div className="flex items-center bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 gap-1 shadow-lg">
              <button
                onClick={() => setMapStyle('streets')}
                className={`px-2 py-1 text-[11px] rounded-lg font-medium transition cursor-pointer ${
                  mapStyle === 'streets' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Google Style
              </button>
              <button
                onClick={() => setMapStyle('dark')}
                className={`px-2 py-1 text-[11px] rounded-lg font-medium transition cursor-pointer ${
                  mapStyle === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Night
              </button>
              <button
                onClick={() => setMapStyle('satellite')}
                className={`px-2 py-1 text-[11px] rounded-lg font-medium transition cursor-pointer ${
                  mapStyle === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Satellite
              </button>
            </div>
          </div>
        </div>

        {/* 3. High-Priority Floating Notification Banner when Equal Distance is Reached */}
        {equalSyncAlert && !alertDismissed && (
          <div className="pointer-events-auto bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-3 sm:p-4 rounded-2xl shadow-2xl border-2 border-white/30 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in slide-in-from-top-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md mt-0.5">
                <Bell className="w-5 h-5 animate-bounce text-white" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold flex flex-wrap items-center gap-2">
                  <span>🔔 TIME TO LEAVE NOW! {equalSyncAlert.targetFriend.toUpperCase()}: START YOUR JOURNEY!</span>
                  <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-mono">
                    Equal ETA Reached: {equalSyncAlert.equalMinutes} mins
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs text-white/95 mt-1 leading-relaxed">
                  {equalSyncAlert.message}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => playSyncAlertChime()}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition cursor-pointer text-white"
                title="Replay notification chime"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAlertDismissed(true)}
                className="bg-white text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-100 transition shadow-lg cursor-pointer"
              >
                I'm Starting Now ✓
              </button>
            </div>
          </div>
        )}

        {/* 4. Bangalore Citywide Search & Location Planner Drawer */}
        {showLocationPlanner && (
          <div className="pointer-events-auto bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3.5 animate-in fade-in slide-in-from-top-2 max-h-[460px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">
                  Search &amp; Synchronize Any Locations in Bangalore
                </span>
                {isLoadingRoutes && (
                  <span className="text-[10px] text-blue-400 animate-pulse">
                    Snapping to road network...
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowLocationPlanner(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation of Nearby Friend Starting Late */}
            <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-500/30 text-[11px] text-blue-200 flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Smart Staggered Departure:</strong> {farFriendName} is further ({Math.max(durationA, durationB)}m) and departs first. {nearbyFriendName} is closer ({Math.min(durationA, durationB)}m) and waits at origin. When {farFriendName} reaches the exact same remaining distance ({thresholdMins}m), {nearbyFriendName} receives an instant alert to depart!
              </span>
            </div>

            {/* 3 Live Search Bars: Friend A, Friend B, Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search Friend A */}
              <div className="relative">
                <label className="block text-[11px] font-semibold text-blue-400 mb-1 flex items-center justify-between">
                  <span>Friend A Origin ({friendALoc.name.split('/')[0].trim()})</span>
                  <span className="text-[10px] text-slate-400">{routeA?.distanceKm || 0} km</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTarget === 'friendA' ? searchQuery : friendALoc.name}
                    onFocus={() => {
                      setSearchTarget('friendA');
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    onChange={handleSearchChange}
                    placeholder="Search area (e.g. Whitefield, Hebbal)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <Search className="w-3.5 h-3.5 text-blue-400 absolute left-2.5 top-2.5" />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Travel time: <strong className="text-blue-300 font-mono">{durationA} mins</strong></span>
                  <span className="text-emerald-400">Road Snapped ✓</span>
                </div>
              </div>

              {/* Search Friend B */}
              <div className="relative">
                <label className="block text-[11px] font-semibold text-purple-400 mb-1 flex items-center justify-between">
                  <span>Friend B Origin ({friendBLoc.name.split('/')[0].trim()})</span>
                  <span className="text-[10px] text-slate-400">{routeB?.distanceKm || 0} km</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTarget === 'friendB' ? searchQuery : friendBLoc.name}
                    onFocus={() => {
                      setSearchTarget('friendB');
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    onChange={handleSearchChange}
                    placeholder="Search area (e.g. E-City, HSR)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <Search className="w-3.5 h-3.5 text-purple-400 absolute left-2.5 top-2.5" />
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Travel time: <strong className="text-purple-300 font-mono">{durationB} mins</strong></span>
                  <span className="text-emerald-400">Road Snapped ✓</span>
                </div>
              </div>

              {/* Search Destination */}
              <div className="relative">
                <label className="block text-[11px] font-semibold text-rose-400 mb-1 flex items-center justify-between">
                  <span>Meetup Destination</span>
                  <span className="text-[10px] text-emerald-400">Sync: 7:30 PM</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTarget === 'dest' ? searchQuery : destLoc.name}
                    onFocus={() => {
                      setSearchTarget('dest');
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    onChange={handleSearchChange}
                    placeholder="Search place (e.g. PVR, UB City)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  <MapPin className="w-3.5 h-3.5 text-rose-400 absolute left-2.5 top-2.5" />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Both arrive at <strong className="text-emerald-300 font-mono">7:30 PM</strong> simultaneously
                </div>
              </div>
            </div>

            {/* Active Search Results Overlay */}
            {searchTarget && searchResults.length > 0 && (
              <div className="bg-slate-900 border border-blue-500/50 rounded-xl p-2 shadow-2xl space-y-1">
                <div className="text-[10px] font-semibold text-slate-400 px-2 py-0.5">
                  Select location for {searchTarget === 'friendA' ? 'Friend A' : searchTarget === 'friendB' ? 'Friend B' : 'Destination'}:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectSearchResult(result)}
                      className="p-2 rounded-lg bg-slate-950/80 hover:bg-blue-950/80 border border-slate-800 hover:border-blue-500 text-left transition text-xs cursor-pointer flex items-start gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white">{result.name}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[240px]">{result.address}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 1-Click Popular Journey Presets */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[11px] font-medium text-slate-400 mb-1.5">Or try 1-Click popular city corridors:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {POPULAR_BANGALORE_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPresetPlan(plan)}
                    className={`p-2 rounded-xl text-left border transition text-xs cursor-pointer ${
                      activePlanId === plan.id
                        ? 'bg-blue-950/80 border-blue-500 text-blue-200 shadow-md shadow-blue-500/20'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold truncate">{plan.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{plan.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Bottom Navigation Control Bar & Real-Time Status Cards */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-slate-950/95 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3.5 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Real-Time Participant Status Cards */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Friend A Live Card */}
          <div className={`p-2 px-3 rounded-xl border flex items-center gap-2 transition-all ${
            stepA >= maxStepsA
              ? 'bg-emerald-950/50 border-emerald-500/50'
              : stepA > 0 || syncSchedule.friendADepartsFirst
              ? 'bg-blue-950/50 border-blue-500/30'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${
              stepA >= maxStepsA
                ? 'bg-emerald-400'
                : stepA > 0 || syncSchedule.friendADepartsFirst
                ? 'bg-blue-400 animate-ping'
                : 'bg-amber-400'
            }`} />
            <div>
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span>Friend A</span>
                <span className="text-[10px] text-blue-300 font-mono">
                  {stepA >= maxStepsA
                    ? 'Arrived ✓'
                    : durationA > durationB && stepA === 0
                    ? `Departs First • ${remainingMinsA}m remaining`
                    : stepA > 0
                    ? `En Route • ${remainingMinsA}m remaining`
                    : isThresholdTriggered
                    ? `🚨 DEPART NOW! • ${remainingMinsA}m rem`
                    : `Wait • Departs when B reaches ${durationA}m`}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[150px] sm:max-w-[200px]">
                {friendALoc.name}
              </div>
            </div>
          </div>

          {/* Friend B Live Card */}
          <div className={`p-2 px-3 rounded-xl border flex items-center gap-2 transition-all ${
            stepB >= maxStepsB
              ? 'bg-emerald-950/50 border-emerald-500/50'
              : stepB > 0
              ? 'bg-purple-950/50 border-purple-500/40'
              : isThresholdTriggered
              ? 'bg-amber-950/80 border-amber-500 text-amber-200 animate-pulse'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${
              stepB >= maxStepsB
                ? 'bg-emerald-400'
                : stepB > 0
                ? 'bg-purple-400 animate-ping'
                : isThresholdTriggered
                ? 'bg-amber-400 animate-ping'
                : 'bg-amber-400'
            }`} />
            <div>
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span>Friend B</span>
                <span className="text-[10px] text-purple-300 font-mono">
                  {stepB >= maxStepsB
                    ? 'Arrived ✓'
                    : stepB > 0
                    ? `En Route • ${remainingMinsB}m remaining`
                    : isThresholdTriggered
                    ? `🚨 DEPART NOW! (Equal Distance Reached • ${remainingMinsB}m rem)`
                    : `⏸️ Starts Late: Waits until A is ${durationB}m away (${minsUntilSyncThreshold}m left)`}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[150px] sm:max-w-[200px]">
                {friendBLoc.name}
              </div>
            </div>
          </div>
        </div>

        {/* Live Simulation Driving Controls */}
        <div className="flex items-center justify-end gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-lg ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause Drive' : 'Simulate Live Drive'}</span>
          </button>

          {/* Speed Toggles */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-[11px] font-mono">
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimSpeed(speed as 1 | 2 | 5)}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  simSpeed === speed ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={handleResetSimulation}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
            title="Reset to Starting Points"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Attach API Key Modal */}
      <Modal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        title="Attach Google Maps API Key"
        description="Optionally provide your own Google Maps API Key or enjoy the built-in clean map tiles"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            The app is already displaying <strong>clean, watermark-free Google-style city street tiles</strong>. If you want to attach your personal Google Cloud Platform API key for live Google Places search and Routes API quota:
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Google Maps Platform API Key
            </label>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Your key is stored securely in your browser's local storage and is never shared.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            {googleApiKey ? (
              <button
                onClick={handleClearApiKey}
                className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
              >
                Remove Saved Key
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowKeyModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveApiKey} leftIcon={<Check className="w-3.5 h-3.5" />}>
                Save Key
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
