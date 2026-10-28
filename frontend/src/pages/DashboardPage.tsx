import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  Radio,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Sparkles,
  Navigation,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BENGALURU_CINEMA_TRIP } from '@/mock/demoData';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTrips] = useState([BENGALURU_CINEMA_TRIP]);

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Journey Synchronization Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor synchronized group arrivals, recommended departure times, and live trips.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/join')}
            leftIcon={<Radio className="w-4 h-4 text-cyan-400" />}
          >
            Join with Code
          </Button>
          <Button
            onClick={() => navigate('/trips/new')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Create New Trip
          </Button>
        </div>
      </div>

      {/* Featured Active Synchronized Trip */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Active Synchronized Trips</h2>
            <Badge variant="success" dot size="sm">1 Active</Badge>
          </div>
          <span className="text-xs text-slate-400">Live Traffic &amp; Route Sync</span>
        </div>

        <div className="grid gap-4">
          {activeTrips.map((trip) => (
            <Card
              key={trip.id}
              variant="interactive"
              className="p-5 border-blue-500/30 hover:border-blue-500/60 transition shadow-xl"
              onClick={() => navigate(`/trips/${trip.id}`)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-base font-bold text-white tracking-tight">{trip.title}</span>
                    <Badge variant="demo" size="sm">Bengaluru Demo</Badge>
                    <Badge variant="info" size="sm">Target: ~60 mins</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="font-medium text-white">{trip.destinationName}</span>
                    <span className="text-slate-500 hidden sm:inline">•</span>
                    <span className="text-slate-400 truncate max-w-xs">{trip.destinationAddress}</span>
                  </div>

                  {/* Participants summary chips */}
                  <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>{trip.participants.length} Participants:</span>
                    </div>
                    {trip.participants.map((p) => (
                      <span
                        key={p.id}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] border border-slate-700/60"
                      >
                        {p.displayName} ({p.startLocationName.split(',')[0]} - {Math.round(p.durationSeconds / 60)}m)
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <div className="text-left lg:text-right">
                    <div className="text-xs text-slate-400">Target Arrival</div>
                    <div className="text-sm font-mono font-bold text-cyan-400">
                      {new Date(trip.targetArrivalTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Open Live Sync
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Card 1: Bengaluru Showcase */}
        <Card className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 border-purple-500/20">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <Badge variant="demo" size="sm">Instant Sandbox</Badge>
          </div>
          <h3 className="text-base font-semibold text-white mt-4">
            Bengaluru Dual-Route Demonstration
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Experience the Whitefield vs Electronic City scenario with live departure countdowns, dynamic traffic simulation, and arrival tolerance checks.
          </p>
          <div className="mt-5">
            <Button
              size="sm"
              variant="secondary"
              className="border-purple-500/30 text-purple-200 hover:bg-purple-900/30"
              onClick={() => navigate('/trips/bengaluru-sync-demo-01')}
            >
              Launch Live Simulation
            </Button>
          </div>
        </Card>

        {/* Card 2: Privacy and Location status */}
        <Card className="p-6 bg-slate-900/90 border-slate-800">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <Badge variant="success" size="sm">Privacy Active</Badge>
          </div>
          <h3 className="text-base font-semibold text-white mt-4">
            Location Sharing Controls
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Your location is only shared with accepted trip participants while a trip is active. You can pause or stop location sharing with a single click anytime.
          </p>
          <div className="mt-5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/settings')}
            >
              Manage Privacy &amp; Alerts
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
