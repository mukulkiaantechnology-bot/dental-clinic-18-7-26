import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, RefreshCw } from 'lucide-react';

export function SystemStatusBar() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncs, setPendingSyncs] = useState(3);
  const [isSyncing, setIsSyncing] = useState(false);

  // Simulated auto-sync decrementer
  useEffect(() => {
    if (pendingSyncs === 0) return;
    
    const interval = setInterval(() => {
      if (isOnline) {
        setIsSyncing(true);
        setTimeout(() => {
          setPendingSyncs((prev) => Math.max(0, prev - 1));
          setIsSyncing(false);
        }, 1000);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [pendingSyncs, isOnline]);

  const handleForceSync = () => {
    if (!isOnline) return;
    setIsSyncing(true);
    setTimeout(() => {
      setPendingSyncs(0);
      setIsSyncing(false);
    }, 1200);
  };

  return (
    <div className="w-full h-8 px-4 bg-slate-900 border-b border-slate-800 text-[10px] font-bold text-slate-400 flex items-center justify-between select-none z-50 flex-shrink-0">
      {/* Left section: Connectivity status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 animate-pulse"></span>
          )}
          <span className={isOnline ? 'text-emerald-400' : 'text-rose-400'}>
            {isOnline ? 'Cloud Sync Connected' : 'Offline Mode Active'}
          </span>
        </div>

        <div className="hidden sm:block text-slate-600">|</div>

        <div className="hidden sm:flex items-center gap-1">
          <Cloud className="h-3 w-3 text-slate-500" />
          <span>HQ Secure Ledger API v1.42</span>
        </div>
      </div>

      {/* Right section: Actions and sync counts */}
      <div className="flex items-center gap-3">
        {pendingSyncs > 0 ? (
          <div className="flex items-center gap-1.5">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[9px] flex items-center gap-1">
              <RefreshCw className={`h-2.5 w-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {pendingSyncs} syncs pending
            </span>
            {isOnline && (
              <button
                onClick={handleForceSync}
                className="hover:text-primary transition-colors cursor-pointer text-[9px] hover:underline"
              >
                Force Sync
              </button>
            )}
          </div>
        ) : (
          <span className="text-emerald-500/80 flex items-center gap-1">
            <CheckCircleIcon className="h-3 w-3" /> All data synced
          </span>
        )}

        <div className="text-slate-600">|</div>

        {/* Online/Offline Toggle */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-all cursor-pointer ${
            isOnline
              ? 'border-slate-800 hover:border-slate-700 hover:bg-slate-800'
              : 'border-rose-950 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40'
          }`}
          title={isOnline ? 'Simulate Connection Drop' : 'Reconnect to Cloud Ledger'}
        >
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3 text-slate-500" />
              <span>Go Offline</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-rose-400 animate-bounce" />
              <span>Go Online</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Minimal inline SVG checkmark icon
function CheckCircleIcon(props) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className="h-3.5 w-3.5 text-emerald-500"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export default SystemStatusBar;
