import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Navigation,
  Clock,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mic,
  MapPin,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/15 to-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Introducing True Journey Synchronization</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Never wait at the destination again.{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Arrive together in real-time.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            SyncRoute AI calculates traffic-aware travel durations for friends starting from different parts of the city and tells each person exactly when to depart so you arrive at the same time.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/trips/new')}
              leftIcon={<Compass className="w-5 h-5" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Plan a Synchronized Trip
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/trips/bengaluru-sync-demo-01')}
              leftIcon={<Sparkles className="w-5 h-5 text-purple-400" />}
            >
              Explore Bengaluru Demo
            </Button>
          </div>

          {/* Social proof / quick metrics */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white font-mono">0 mins</div>
              <div className="text-xs text-slate-400 mt-0.5">Average Lobby Wait Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400 font-mono">±3 mins</div>
              <div className="text-xs text-slate-400 mt-0.5">Arrival Synchronization Tolerance</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">Dynamic</div>
              <div className="text-xs text-slate-400 mt-0.5">Traffic-Adaptive Recalculations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400 font-mono">AI Voice</div>
              <div className="text-xs text-slate-400 mt-0.5">Hands-Free In-Drive Assistance</div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Example: Bengaluru Cinema Scenario */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <Badge variant="demo" size="sm" dot>REAL-WORLD BENGALURU SCENARIO</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
              How SyncRoute AI Synchronizes Two Unequal Journeys
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Friend A leaves Whitefield (farther, heavy traffic) while Friend B starts from Electronic City.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Friend A Card */}
            <Card className="border-blue-500/30 bg-slate-900/80 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Friend A (Whitefield)
                </span>
                <Badge variant="danger" size="sm">Heavy Traffic</Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Start Location:</span>
                  <span className="text-white font-medium">ITPL Main Rd (21.4 km)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimated Duration:</span>
                  <span className="text-blue-400 font-bold font-mono">55 mins</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/20 text-xs text-blue-200">
                  <strong>Sync Recommendation:</strong> Depart now at <strong>6:35 PM</strong> to reach Koramangala cinema by 7:30 PM.
                </div>
              </div>
            </Card>

            {/* Friend B Card */}
            <Card className="border-indigo-500/30 bg-slate-900/80 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Friend B (Electronic City)
                </span>
                <Badge variant="warning" size="sm">Moderate Traffic</Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Start Location:</span>
                  <span className="text-white font-medium">Phase 1 Flyover (14.2 km)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimated Duration:</span>
                  <span className="text-indigo-400 font-bold font-mono">32 mins</span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200">
                  <strong>Sync Recommendation:</strong> Relax! Wait <strong>23 minutes</strong>. Depart at <strong>6:58 PM</strong> to arrive simultaneously.
                </div>
              </div>
            </Card>
          </div>

          {/* Synchronized Result Banner */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-blue-950/60 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Target Reached: Nexus Koramangala at 7:30 PM</h4>
                <p className="text-xs text-slate-300">Both friends step out of their cars within 2 minutes of each other.</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="success"
              onClick={() => navigate('/trips/bengaluru-sync-demo-01')}
            >
              Simulate Live Trip
            </Button>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white">Core Architectural Capabilities</h2>
          <p className="text-slate-400 text-sm mt-2">Engineered specifically for synchronized multi-party journeys</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Dedicated Synchronization Engine</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Calculates target arrival, individual departure countdowns, and arrival gaps. Avoids naive distance approximations by incorporating real traffic-aware durations.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Privacy-First Location Sharing</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Locations are shared only with verified trip participants while journeys are active. Participants can pause or revoke location sharing instantly with one tap.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Conversational AI Voice Assistant</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Hands-free commands in the car: "How many minutes apart will we arrive?", "Recalculate plan due to traffic", and "Stop sharing my location" with tool security guards.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};
