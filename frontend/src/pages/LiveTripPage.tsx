import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Navigation,
  Users,
  Copy,
  Check,
  Share2,
  AlertTriangle,
  Play,
  Pause,
  LogOut,
  RefreshCw,
  Radio,
  Mic,
  Car,
  Shield,
  Sparkles,
  Wifi,
  WifiOff,
  Bell,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { ArrivalGapMeter } from '@/components/ui/ArrivalGapMeter';
import { DemoBanner } from '@/components/DemoBanner';
import { RealisticGoogleMap } from '@/components/RealisticGoogleMap';
import { BENGALURU_CINEMA_TRIP, BENGALURU_SYNC_ANALYSIS } from '@/mock/demoData';
import { useRealtimeTrip } from '@/hooks/useRealtimeTrip';

interface LiveTripPageProps {
  onOpenVoiceAssistant?: () => void;
}

export const LiveTripPage: React.FC<LiveTripPageProps> = ({ onOpenVoiceAssistant }) => {
  const { tripId = 'bengaluru-sync-demo-01' } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  // Real-time hook for live WebSocket synchronization & Geolocation
  const {
    trip: realtimeTrip,
    syncAnalysis: realtimeSync,
    notifications,
    isConnected,
    isTrackingGps,
    gpsError,
    startGpsTracking,
    stopGpsTracking,
    emitStatusUpdate,
    emitSharingToggle,
    dismissNotification
  } = useRealtimeTrip(tripId, BENGALURU_CINEMA_TRIP, BENGALURU_SYNC_ANALYSIS);

  const [isDemoMode, setIsDemoMode] = useState(true);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [simulatedTrafficDelay, setSimulatedTrafficDelay] = useState(false);
  const [currentParticipantId, setCurrentParticipantId] = useState('part-01-a');

  // Fallback to demo objects if realtime data loading
  const trip = realtimeTrip || BENGALURU_CINEMA_TRIP;
  const analysis = realtimeSync || BENGALURU_SYNC_ANALYSIS;

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/join/${trip.inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleToggleStartJourney = (participantId: string) => {
    const participant = trip.participants.find(p => p.id === participantId);
    if (!participant) return;

    const nextStatus = participant.journeyStatus === 'not_started'
      ? 'en_route'
      : participant.journeyStatus === 'en_route'
      ? 'arrived'
      : 'not_started';

    emitStatusUpdate(participantId, nextStatus);
  };

  const handleToggleLocationSharing = (participantId: string) => {
    const participant = trip.participants.find(p => p.id === participantId);
    if (!participant) return;

    emitSharingToggle(participantId, !participant.isSharingLocation);
  };

  // Simulate traffic surge (Testing/Demo requirement: "Traffic-related ETA changes")
  const handleSimulateTrafficChange = () => {
    setSimulatedTrafficDelay(!simulatedTrafficDelay);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Demo Status Banner */}
      <DemoBanner
        isDemoMode={isDemoMode}
        onToggleDemo={() => setIsDemoMode(!isDemoMode)}
      />

      {/* Real-Time Notification Floating Toasts */}
      {notifications.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 w-full space-y-2">
          {notifications.slice(0, 2).map((n) => (
            <div
              key={n.id}
              className="p-3.5 rounded-xl bg-slate-900 border border-blue-500/40 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <Bell className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{n.title}</div>
                  <div className="text-[11px] text-slate-300">{n.message}</div>
                </div>
              </div>
              <button
                onClick={() => dismissNotification(n.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* GPS Error notice */}
      {gpsError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 w-full">
          <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {gpsError}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6 w-full">
        {/* Top Destination & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-bold text-white tracking-tight">{trip.title}</span>
              <Badge variant="info" size="sm">Active Sync</Badge>
              <Badge variant="neutral" size="sm">Code: {trip.inviteCode}</Badge>

              {/* Socket.IO Connection Pill */}
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                {isConnected ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Real-Time Sync</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Connecting...</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="font-semibold text-white">{trip.destinationName}</span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-slate-400 truncate max-w-md">{trip.destinationAddress}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live GPS Toggle */}
            <Button
              variant={isTrackingGps ? 'danger' : 'outline'}
              size="sm"
              onClick={() => isTrackingGps ? stopGpsTracking() : startGpsTracking(currentParticipantId)}
              leftIcon={<Radio className={`w-3.5 h-3.5 ${isTrackingGps ? 'animate-pulse' : ''}`} />}
            >
              {isTrackingGps ? 'Stop GPS' : 'Enable Real GPS'}
            </Button>

            {/* Invite Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyInvite}
              leftIcon={copiedInvite ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            >
              {copiedInvite ? 'Link Copied!' : 'Copy Invite Link'}
            </Button>

            {/* AI Voice Assistant Trigger */}
            {onOpenVoiceAssistant && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenVoiceAssistant}
                leftIcon={<Mic className="w-4 h-4 text-cyan-400" />}
                className="border-cyan-500/30 text-cyan-300 hover:border-cyan-400/50"
              >
                Voice Assistant
              </Button>
            )}

            {/* Test Traffic Variation Button */}
            <Button
              variant={simulatedTrafficDelay ? 'danger' : 'outline'}
              size="sm"
              onClick={handleSimulateTrafficChange}
              leftIcon={<AlertTriangle className="w-4 h-4" />}
            >
              {simulatedTrafficDelay ? 'Reset Traffic' : 'Simulate Delay'}
            </Button>
          </div>
        </div>

        {/* Core Synchronization Differentiator: Arrival Gap Meter */}
        <ArrivalGapMeter
          gapSeconds={analysis.arrivalGapSeconds}
          toleranceMinutes={trip.arrivalToleranceMinutes}
          earliestName={analysis.earliestArrivalParticipant}
          latestName={analysis.latestArrivalParticipant}
          targetArrivalTimeFormatted={new Date(trip.targetArrivalTime || analysis.targetArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        />

        {/* Main Grid: Map & Participant Synchronization Cards */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Map Column (7 Cols on desktop) */}
          <div className="lg:col-span-7 space-y-4">
            <RealisticGoogleMap
              trip={trip}
              participants={trip.participants}
              syncAnalysis={analysis}
            />

            {/* Background Location Disclosure Notice */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Browser Location Privacy &amp; Limitations:</strong> Live GPS coordinates are only queried when this tab is active. Modern mobile browsers suspend continuous background tracking when the browser is minimized or closed.
              </span>
            </div>
          </div>

          {/* Participant Synchronized Roster (5 Cols on desktop) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Participant Departure Plan</h3>
              </div>
              <span className="text-xs text-slate-400">
                {trip.participants.length} Travellers
              </span>
            </div>

            {/* Participant Cards */}
            <div className="space-y-3.5">
              {trip.participants.map((participant) => {
                const isMe = participant.id === currentParticipantId;
                const rec = analysis.recommendations[participant.id];

                return (
                  <Card
                    key={participant.id}
                    className={`p-4 border transition-all ${
                      isMe ? 'border-blue-500/50 bg-slate-900' : 'border-slate-800 bg-slate-900/70'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isMe ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                        }`}>
                          {participant.displayName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-white">{participant.displayName}</span>
                            {isMe && <Badge variant="info" size="sm">You</Badge>}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {participant.startLocationName}
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant={participant.journeyStatus === 'en_route' ? 'info' : participant.journeyStatus === 'arrived' ? 'success' : 'neutral'}
                        dot={participant.journeyStatus === 'en_route'}
                        size="sm"
                      >
                        {participant.journeyStatus === 'en_route' ? 'En Route' : participant.journeyStatus === 'arrived' ? 'Arrived' : 'Not Started'}
                      </Badge>
                    </div>

                    {/* Synchronization Timing Countdown */}
                    <div className="my-2.5">
                      <CountdownTimer
                        targetTime={participant.recommendedDepartureTime}
                        status={participant.journeyStatus}
                      />
                    </div>

                    {/* Route Details & Traffic Status */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 my-2.5">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Travel Duration</span>
                        <span className="font-semibold text-white font-mono">
                          {Math.round(participant.durationSeconds / 60)} mins
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Traffic Condition</span>
                        <span className={`font-semibold capitalize ${
                          participant.trafficStatus === 'heavy' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {participant.trafficStatus || 'Normal'}
                        </span>
                      </div>
                    </div>

                    {/* Advice message */}
                    {rec && (
                      <div className="text-[11px] text-slate-400 bg-blue-950/20 border border-blue-500/20 p-2 rounded-lg mb-3">
                        {rec.adviceMessage}
                      </div>
                    )}

                    {/* Participant Controls */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      {/* Location Sharing status */}
                      <button
                        onClick={() => handleToggleLocationSharing(participant.id)}
                        className={`flex items-center gap-1 text-[11px] font-medium transition cursor-pointer ${
                          participant.isSharingLocation ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'
                        }`}
                        title="Toggle Location Sharing"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>{participant.isSharingLocation ? 'Sharing GPS' : 'GPS Paused'}</span>
                      </button>

                      {/* Journey Action Button */}
                      <Button
                        size="sm"
                        variant={participant.journeyStatus === 'not_started' ? 'primary' : participant.journeyStatus === 'en_route' ? 'success' : 'secondary'}
                        onClick={() => handleToggleStartJourney(participant.id)}
                        leftIcon={participant.journeyStatus === 'not_started' ? <Play className="w-3.5 h-3.5" /> : <Navigation className="w-3.5 h-3.5" />}
                      >
                        {participant.journeyStatus === 'not_started' ? 'Start Journey' : participant.journeyStatus === 'en_route' ? 'Mark Arrived' : 'Reset'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
