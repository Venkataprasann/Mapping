import React, { useState } from 'react';
import {
  Shield,
  Bell,
  MapPin,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Key,
  Database,
  Radio,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const SettingsPage: React.FC = () => {
  // Settings State
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [highAccuracy, setHighAccuracy] = useState(true);
  const [notifyLeaveNow, setNotifyLeaveNow] = useState(true);
  const [notifyGapThreats, setNotifyGapThreats] = useState(true);
  const [notifyArrivals, setNotifyArrivals] = useState(true);
  const [cooldownMinutes, setCooldownMinutes] = useState(5);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Settings &amp; Preferences
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your location sharing privacy, synchronization alerts, and API configurations.
          </p>
        </div>

        {savedToast && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Preferences Saved!
          </div>
        )}
      </div>

      {/* Section 1: Location Privacy & Permission Controls */}
      <Card className="p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Location Permissions &amp; Privacy</h2>
            <p className="text-xs text-slate-400">Strict privacy controls for your GPS coordinates</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-white block">Active Trip Location Sharing</span>
              <span className="text-xs text-slate-400 block">
                Allow SyncRoute AI to broadcast your position to other trip participants while travelling.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={locationEnabled}
                onChange={(e) => setLocationEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-white block">High Accuracy GPS</span>
              <span className="text-xs text-slate-400 block">
                Uses hardware GPS for accurate traffic junction positioning when available.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={highAccuracy}
                onChange={(e) => setHighAccuracy(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          {/* Browser Limitation Notice */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-semibold text-blue-300">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              Browser Background Tracking Notice
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Standard mobile web browsers (Safari, Chrome) restrict continuous GPS querying when a browser tab is placed in the background or device screen is locked. Keep this tab open on your dashboard during drive navigation for the smoothest real-time sync.
            </p>
          </div>
        </div>
      </Card>

      {/* Section 2: Notifications & Anti-Flapping Thresholds */}
      <Card className="p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Synchronization Alerts &amp; Notifications</h2>
            <p className="text-xs text-slate-400">Prevent notification spam with smart cooldown thresholds</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-white block">Departure Recommendation ("Leave Now!")</span>
              <span className="text-xs text-slate-400 block">
                Receive proactive reminders when your computed departure window arrives.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifyLeaveNow}
              onChange={(e) => setNotifyLeaveNow(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-white block">Arrival Gap &amp; Delay Threat Alerts</span>
              <span className="text-xs text-slate-400 block">
                Notify when traffic spikes threaten the synchronized target by &gt; 3 minutes.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notifyGapThreats}
              onChange={(e) => setNotifyGapThreats(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Anti-Spam Notification Cooldown:</span>
              <span className="font-mono font-bold text-cyan-400">{cooldownMinutes} minutes</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={cooldownMinutes}
              onChange={(e) => setCooldownMinutes(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Prevents duplicate alerts when traffic fluctuations alter ETAs by only a few seconds.
            </p>
          </div>
        </div>
      </Card>

      {/* Section 3: Integration Credential Status */}
      <Card className="p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">System Integrations &amp; API Connectivity</h2>
            <p className="text-xs text-slate-400">Live API and Fallback Simulation health</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Google Routes API</span>
              <Badge variant="demo" size="sm">Active (Demo/Live)</Badge>
            </div>
            <p className="text-[11px] text-slate-400">Traffic-aware travel matrix calculation</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Supabase / PostgreSQL</span>
              <Badge variant="success" size="sm">Connected</Badge>
            </div>
            <p className="text-[11px] text-slate-400">Row Level Security &amp; Trip Auth</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">OpenAI Voice API</span>
              <Badge variant="info" size="sm">Available</Badge>
            </div>
            <p className="text-[11px] text-slate-400">Voice command assistant &amp; tools</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
};
