import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, Navigation } from 'lucide-react';

interface CountdownTimerProps {
  targetTime?: string; // ISO string of recommended departure
  status?: 'not_started' | 'en_route' | 'arrived' | 'paused';
  compact?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetTime,
  status = 'not_started',
  compact = false
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!targetTime || status !== 'not_started') {
      setSecondsLeft(null);
      return;
    }

    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(targetTime).getTime();
      const diff = Math.floor((target - now) / 1000);
      setSecondsLeft(diff);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetTime, status]);

  if (status === 'arrived') {
    return (
      <div className={`inline-flex items-center gap-1.5 font-semibold text-emerald-400 ${compact ? 'text-xs' : 'text-sm'}`}>
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Arrived at Destination</span>
      </div>
    );
  }

  if (status === 'en_route') {
    return (
      <div className={`inline-flex items-center gap-1.5 font-semibold text-blue-400 ${compact ? 'text-xs' : 'text-sm'}`}>
        <Navigation className="w-4 h-4 shrink-0 animate-bounce" />
        <span>En Route to Destination</span>
      </div>
    );
  }

  if (secondsLeft === null) {
    return (
      <div className="text-slate-400 text-xs flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" />
        <span>Calculating timing...</span>
      </div>
    );
  }

  // Format mm:ss or hh:mm:ss
  const isOverdue = secondsLeft <= 0;
  const absSeconds = Math.abs(secondsLeft);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;

  const formattedTime = hours > 0
    ? `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Urgency color styling
  let colorStyle = 'bg-blue-950/60 border-blue-500/30 text-blue-300';
  let badgeText = 'Leave in';
  let isLeaveNow = false;

  if (isOverdue) {
    colorStyle = 'bg-rose-950/80 border-rose-500/50 text-rose-300 animate-pulse';
    badgeText = 'Leave Immediately! (Late by';
    isLeaveNow = true;
  } else if (secondsLeft <= 180) { // under 3 mins
    colorStyle = 'bg-amber-950/80 border-amber-500/50 text-amber-300';
    badgeText = 'Prepare to leave in';
  }

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 font-mono font-medium px-2 py-0.5 rounded-lg border text-xs ${colorStyle}`}>
        <Clock className="w-3 h-3" />
        {isOverdue ? `-${formattedTime}` : formattedTime}
      </span>
    );
  }

  return (
    <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${colorStyle}`}>
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-lg ${isLeaveNow ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
          {isOverdue ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <Clock className="w-5 h-5" />}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold opacity-80">
            {badgeText}
          </div>
          <div className="text-lg font-mono font-bold tracking-tight">
            {formattedTime} {isOverdue && ')'}
          </div>
        </div>
      </div>
      <div className="text-[11px] text-right font-medium opacity-80">
        Sync Target: Departure
      </div>
    </div>
  );
};
