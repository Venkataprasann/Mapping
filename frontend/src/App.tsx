import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { VoiceAssistantModal } from '@/components/VoiceAssistantModal';
import { LandingPage } from '@/pages/LandingPage';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CreateTripPage } from '@/pages/CreateTripPage';
import { JoinTripPage } from '@/pages/JoinTripPage';
import { LiveTripPage } from '@/pages/LiveTripPage';
import { SettingsPage } from '@/pages/SettingsPage';

function AppContent() {
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Navigation */}
      <Navbar
        onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
        onLaunchDemo={() => navigate('/trips/bengaluru-sync-demo-01')}
      />

      {/* Main Screen Routes */}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/trips/new" element={<CreateTripPage />} />
          <Route path="/join" element={<JoinTripPage />} />
          <Route path="/join/:code" element={<JoinTripPage />} />
          <Route
            path="/trips/:tripId"
            element={<LiveTripPage onOpenVoiceAssistant={() => setIsVoiceOpen(true)} />}
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      {/* Conversational Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />

      {/* Global Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            SyncRoute AI &copy; {new Date().getFullYear()} — Real-Time Group Journey Synchronization
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Bengaluru Edition</span>
            <span>•</span>
            <span>Google Maps Platform</span>
            <span>•</span>
            <span>OpenAI Voice</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
