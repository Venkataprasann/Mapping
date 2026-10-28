import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import { Badge } from './ui/Badge';

interface DemoBannerProps {
  isDemoMode: boolean;
  onToggleDemo?: () => void;
  scenarioTitle?: string;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  isDemoMode,
  onToggleDemo,
  scenarioTitle = 'Bengaluru Multi-Point Sync Demo (Whitefield & Electronic City → Koramangala)'
}) => {
  if (!isDemoMode) {
    return (
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Badge variant="success" dot size="sm">LIVE DATA</Badge>
          <span>Real-time GPS tracking and live Google Routes API mode</span>
        </div>
        {onToggleDemo && (
          <button
            onClick={onToggleDemo}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium underline flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            Switch to Demo Simulation
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-slate-900 border-b border-purple-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
      <div className="flex items-center gap-2.5">
        <Badge variant="demo" dot size="sm">SIMULATION / DEMO MODE</Badge>
        <span className="text-purple-200 font-medium">{scenarioTitle}</span>
        <span className="hidden md:inline text-purple-300/70">
          (Locations, traffic variations and ETAs are simulated for demonstration)
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-purple-300/80 flex items-center gap-1 text-[11px]">
          <Info className="w-3.5 h-3.5" />
          No live GPS required
        </span>
        {onToggleDemo && (
          <button
            onClick={onToggleDemo}
            className="text-xs bg-purple-900/60 hover:bg-purple-800/60 border border-purple-400/30 text-purple-200 px-2.5 py-1 rounded-lg transition cursor-pointer font-medium"
          >
            Exit Demo Mode
          </button>
        )}
      </div>
    </div>
  );
};
