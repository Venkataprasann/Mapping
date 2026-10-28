import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Navigation,
  Sparkles,
  Users,
  Sliders,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/services/api';

const BENGALURU_DESTINATION_PRESETS = [
  {
    name: 'PVR Cinemas, Nexus Koramangala',
    address: 'Hosur Rd, Chikku Lakshmaiah Layout, Koramangala, Bengaluru',
    lat: 12.9345,
    lng: 77.6111
  },
  {
    name: 'UB City Mall, Central Bengaluru',
    address: '24 Vittal Mallya Rd, KG Halli, D Souza Layout, Ashok Nagar, Bengaluru',
    lat: 12.9716,
    lng: 77.5959
  },
  {
    name: 'Phoenix Marketcity, Whitefield',
    address: 'Mahadevapura, Whitefield Main Rd, Devasandra Industrial Estate, Bengaluru',
    lat: 12.9972,
    lng: 77.6974
  },
  {
    name: 'Forum South Bangalore, Konanakunte',
    address: 'Anjanadri Layout, Konanakunte, Bengaluru',
    lat: 12.8885,
    lng: 77.5707
  }
];

const START_LOCATION_PRESETS = [
  { name: 'ITPL Main Rd, Whitefield', lat: 12.9850, lng: 77.7300 },
  { name: 'Phase 1, Electronic City', lat: 12.8452, lng: 77.6602 },
  { name: 'Indiranagar 100ft Road', lat: 12.9784, lng: 77.6408 },
  { name: 'HSR Layout Sector 1', lat: 12.9116, lng: 77.6534 }
];

export const CreateTripPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('Movie & Dinner in Koramangala');
  const [destinationName, setDestinationName] = useState(BENGALURU_DESTINATION_PRESETS[0].name);
  const [destinationAddress, setDestinationAddress] = useState(BENGALURU_DESTINATION_PRESETS[0].address);
  const [destinationCoords, setDestinationCoords] = useState({
    lat: BENGALURU_DESTINATION_PRESETS[0].lat,
    lng: BENGALURU_DESTINATION_PRESETS[0].lng
  });

  const [creatorName, setCreatorName] = useState('Friend A (You)');
  const [startLocationName, setStartLocationName] = useState(START_LOCATION_PRESETS[0].name);
  const [startCoords, setStartCoords] = useState({
    lat: START_LOCATION_PRESETS[0].lat,
    lng: START_LOCATION_PRESETS[0].lng
  });

  const [targetTimeMode, setTargetTimeMode] = useState<'fixed' | 'earliest_sync'>('fixed');
  const [targetTime, setTargetTime] = useState('19:30');
  const [arrivalTolerance, setArrivalTolerance] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPreset = (preset: typeof BENGALURU_DESTINATION_PRESETS[0]) => {
    setDestinationName(preset.name);
    setDestinationAddress(preset.address);
    setDestinationCoords({ lat: preset.lat, lng: preset.lng });
  };

  const handleSelectStartPreset = (preset: typeof START_LOCATION_PRESETS[0]) => {
    setStartLocationName(preset.name);
    setStartCoords({ lat: preset.lat, lng: preset.lng });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Calculate target time timestamp if in fixed mode
      let targetIso: string | undefined = undefined;
      if (targetTimeMode === 'fixed' && targetTime) {
        const [hours, minutes] = targetTime.split(':').map(Number);
        const targetDate = new Date();
        targetDate.setHours(hours, minutes, 0, 0);
        if (targetDate.getTime() < Date.now()) {
          targetDate.setDate(targetDate.getDate() + 1); // tomorrow
        }
        targetIso = targetDate.toISOString();
      }

      const res = await api.createTrip({
        title,
        destinationName,
        destinationAddress,
        destinationCoordinates: destinationCoords,
        targetArrivalTime: targetIso,
        arrivalToleranceMinutes: arrivalTolerance,
        startLocationName,
        startCoordinates: startCoords
      });

      navigate(`/trips/${res.trip.id}`);
    } catch (err) {
      console.warn('Backend API unavailable, loading Bengaluru simulation trip:', err);
      navigate('/trips/bengaluru-sync-demo-01');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Create Synchronized Trip
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Coordinate departure times so all friends arrive at the destination together.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Destination */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">1. Destination</h2>
              <p className="text-xs text-slate-400">Where is everyone gathering?</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Trip Name / Occasion
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cinema Night with Friends"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Destination Name &amp; Address
              </label>
              <input
                type="text"
                required
                value={destinationName}
                onChange={(e) => {
                  setDestinationName(e.target.value);
                  setDestinationAddress(e.target.value);
                }}
                placeholder="Search destination via Google Places or choose preset..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-2">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Bengaluru Destination Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {BENGALURU_DESTINATION_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`px-3 py-1.5 text-xs rounded-xl border text-left transition cursor-pointer ${
                      destinationName === p.name
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {p.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Step 2: Synchronization Timing & Tolerance */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">2. Arrival Synchronization</h2>
              <p className="text-xs text-slate-400">Configure target arrival and tolerance</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Target mode selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Arrival Goal
              </label>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTargetTimeMode('fixed')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    targetTimeMode === 'fixed'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Specific Showtime / Time
                </button>
                <button
                  type="button"
                  onClick={() => setTargetTimeMode('earliest_sync')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    targetTimeMode === 'earliest_sync'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Earliest Synchronized
                </button>
              </div>
            </div>

            {targetTimeMode === 'fixed' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Target Arrival Time
                </label>
                <input
                  type="time"
                  required
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            )}

            {/* Tolerance slider */}
            <div className="sm:col-span-2 pt-2">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-medium text-slate-300">Acceptable Arrival Tolerance:</span>
                <span className="font-bold text-cyan-400 font-mono">±{arrivalTolerance} minutes</span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                step="1"
                value={arrivalTolerance}
                onChange={(e) => setArrivalTolerance(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                If predicted arrival gap exceeds {arrivalTolerance} mins, SyncRoute AI alerts the group to adjust departures.
              </p>
            </div>
          </div>
        </Card>

        {/* Step 3: Creator's Starting Location */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">3. Your Starting Location</h2>
              <p className="text-xs text-slate-400">Where are you starting your journey from?</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="Friend A (You)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Starting Point
                </label>
                <input
                  type="text"
                  required
                  value={startLocationName}
                  onChange={(e) => setStartLocationName(e.target.value)}
                  placeholder="e.g. Whitefield, Indiranagar, etc."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Starting presets */}
            <div>
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-2">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Starting Point Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {START_LOCATION_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectStartPreset(p)}
                    className={`px-3 py-1.5 text-xs rounded-xl border text-left transition cursor-pointer ${
                      startLocationName === p.name
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Users className="w-4 h-4" />}
          >
            Create Trip &amp; Get Invite Code
          </Button>
        </div>
      </form>
    </div>
  );
};
