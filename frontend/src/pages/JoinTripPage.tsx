import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Radio, Users, MapPin, ArrowRight, Sparkles, Navigation, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BENGALURU_CINEMA_TRIP } from '@/mock/demoData';

export const JoinTripPage: React.FC = () => {
  const navigate = useNavigate();
  const { code: paramCode } = useParams<{ code?: string }>();

  const [tripCode, setTripCode] = useState(paramCode || 'BLR779');
  const [participantName, setParticipantName] = useState('Friend B (Arjun)');
  const [startLocation, setStartLocation] = useState('Phase 1, Electronic City, Bengaluru');
  const [shareLocation, setShareLocation] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  // Quick lookup mock
  const trip = BENGALURU_CINEMA_TRIP;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    setTimeout(() => {
      setIsJoining(false);
      navigate(`/trips/${trip.id}`);
    }, 600);
  };

  return (
    <div className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Join Synchronized Trip
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Enter a 6-character code or confirm your participation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Invitation Details
            </span>
            <Badge variant="demo" size="sm">Bengaluru Scenario</Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Trip Destination Info Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{trip.title}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{trip.destinationName}</span>
                </div>
              </div>
              <Badge variant="info" size="sm">
                Target: {new Date(trip.targetArrivalTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500">{trip.destinationAddress}</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Trip Code / Token
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={tripCode}
                  onChange={(e) => setTripCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BLR779"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono tracking-widest uppercase text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Radio className="absolute right-3.5 top-3 w-4 h-4 text-cyan-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Your Display Name
              </label>
              <input
                type="text"
                required
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="e.g. Arjun"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Your Starting Location
              </label>
              <input
                type="text"
                required
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="Where are you starting from?"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                SyncRoute AI uses this to calculate your personalized departure recommendation.
              </p>
            </div>

            {/* Location Sharing Toggle */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={shareLocation}
                  onChange={(e) => setShareLocation(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  Share live location with trip members once my journey begins.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full mt-4"
              isLoading={isJoining}
              leftIcon={<Users className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Join Trip &amp; View Departure Recommendation
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified secure trip membership. Coordinates shared only with approved participants.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
