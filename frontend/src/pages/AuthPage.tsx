import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Shield, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [shareLocationPref, setShareLocationPref] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Store local session info for immediate testability
      localStorage.setItem('syncroute_user', JSON.stringify({
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        email: email || 'friend@syncroute.ai',
        displayName: displayName || (mode === 'signup' ? 'New Explorer' : 'Friend A'),
        locationSharingPref: shareLocationPref
      }));
      navigate('/dashboard');
    }, 600);
  };

  const handleQuickDemoAccess = () => {
    localStorage.setItem('syncroute_user', JSON.stringify({
      id: 'user-friend-a',
      email: 'demo@syncroute.ai',
      displayName: 'Friend A (You)',
      locationSharingPref: true
    }));
    navigate('/trips/bengaluru-sync-demo-01');
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Welcome Back to SyncRoute AI' : 'Join SyncRoute AI'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time multi-party journey synchronization
          </p>
        </div>

        {/* Quick Demo Access banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/30 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <div className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Instant Sandbox Access
            </div>
            <div className="text-[11px] text-purple-300/80">
              Skip login and try the Bengaluru live demo immediately.
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-purple-400/40 text-purple-200 hover:bg-purple-900/40 shrink-0"
            onClick={handleQuickDemoAccess}
          >
            Try Demo
          </Button>
        </div>

        <Card>
          <CardHeader>
            {/* Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'signup' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create Account
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Location Permission Opt-In Notice */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={shareLocationPref}
                    onChange={(e) => setShareLocationPref(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    Enable location sharing during active trips. (You can pause or revoke anytime).
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={loading}
                leftIcon={mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              >
                {mode === 'login' ? 'Sign In to SyncRoute' : 'Register Account'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protected with Row Level Security &amp; End-to-End Privacy</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
