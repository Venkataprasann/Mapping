import React from 'react';
import { Users, CheckCircle2, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { Badge } from './Badge';

interface ArrivalGapMeterProps {
  gapSeconds: number;
  toleranceMinutes: number;
  earliestName?: string;
  latestName?: string;
  targetArrivalTimeFormatted?: string;
}

export const ArrivalGapMeter: React.FC<ArrivalGapMeterProps> = ({
  gapSeconds,
  toleranceMinutes,
  earliestName = 'Friend A',
  latestName = 'Friend B',
  targetArrivalTimeFormatted
}) => {
  const gapMinutes = Math.round(gapSeconds / 60);
  const isOnTrack = gapMinutes <= toleranceMinutes;
  const isHighDelay = gapMinutes > toleranceMinutes * 2;

  // Percentage for the gauge (0 to max 3x tolerance)
  const maxRange = Math.max(toleranceMinutes * 2.5, 15);
  const percentage = Math.min(Math.round((gapMinutes / maxRange) * 100), 100);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Synchronized Arrival Gap</h4>
            <p className="text-xs text-slate-400">
              Tolerance limit: <span className="font-medium text-slate-200">±{toleranceMinutes} mins</span>
            </p>
          </div>
        </div>

        <div>
          {isOnTrack ? (
            <Badge variant="success" dot>
              <CheckCircle2 className="w-3.5 h-3.5" />
              ON TRACK ({gapMinutes} min gap)
            </Badge>
          ) : isHighDelay ? (
            <Badge variant="danger" dot>
              <AlertTriangle className="w-3.5 h-3.5" />
              DELAY THREAT (+{gapMinutes} mins)
            </Badge>
          ) : (
            <Badge variant="warning" dot>
              <AlertTriangle className="w-3.5 h-3.5" />
              SLIGHT GAP ({gapMinutes} mins)
            </Badge>
          )}
        </div>
      </div>

      {/* Visual meter bar */}
      <div className="space-y-1.5 my-3">
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Perfect Sync (0 min)</span>
          <span className="text-amber-400 font-medium">Tolerance ({toleranceMinutes}m)</span>
          <span>Mismatch ({maxRange}m+)</span>
        </div>
        <div className="relative h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
          {/* Tolerance safe zone highlight */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-emerald-500/20 border-r border-emerald-500/40"
            style={{ width: `${Math.min((toleranceMinutes / maxRange) * 100, 100)}%` }}
          />
          {/* Current gap indicator */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOnTrack ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : isHighDelay ? 'bg-rose-500 shadow-lg shadow-rose-500/50' : 'bg-amber-400'
            }`}
            style={{ width: `${Math.max(percentage, 4)}%` }}
          />
        </div>
      </div>

      {/* Participants summary */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>
            <strong className="text-white">{earliestName}</strong> arrives ~{gapMinutes}m ahead of <strong className="text-white">{latestName}</strong>
          </span>
        </div>
        {targetArrivalTimeFormatted && (
          <div className="text-slate-400">
            Target: <span className="font-semibold text-blue-400">{targetArrivalTimeFormatted}</span>
          </div>
        )}
      </div>
    </div>
  );
};
