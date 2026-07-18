import { useState, useEffect, useRef } from 'react';
import { useAlertStore } from '../../store/alertStore';
import { useAuthStore } from '../../store/authStore';
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Inbox
} from 'lucide-react';
import { Button } from './Button';

export function AlertDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  const user = useAuthStore((state) => state.user);
  const { alerts, markAsRead, markAllAsRead, subscribeToRoleAlerts } = useAlertStore();

  // Subscribe to real-time updates on mount
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToRoleAlerts();
      return () => unsubscribe();
    }
  }, [user, subscribeToRoleAlerts]);

  // Click outside handler to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.read);
  const displayedAlerts = filter === 'unread' ? unreadAlerts : alerts;

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'critical':
        return <AlertOctagon className="h-4 w-4 text-rose-500 animate-bounce" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-indigo-500" />;
    }
  };

  const getAlertBg = (type, read) => {
    if (read) return 'bg-card hover:bg-muted/30';
    switch (type) {
      case 'success':
        return 'bg-emerald-500/5 hover:bg-emerald-500/10 border-l-2 border-emerald-500';
      case 'warning':
        return 'bg-amber-500/5 hover:bg-amber-500/10 border-l-2 border-amber-500';
      case 'critical':
        return 'bg-rose-500/5 hover:bg-rose-500/10 border-l-2 border-rose-500';
      case 'info':
      default:
        return 'bg-indigo-500/5 hover:bg-indigo-500/10 border-l-2 border-indigo-500';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 rounded-full text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none flex items-center justify-center hover:bg-muted/40 transition-colors"
        title="View Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadAlerts.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-[9px] font-extrabold text-white flex items-center justify-center border border-card shadow-sm animate-pulse">
            {unreadAlerts.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 md:w-96 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-foreground">Notifications</h4>
              <p className="text-[10px] text-muted-foreground font-semibold">
                {unreadAlerts.length} unread updates
              </p>
            </div>
            {unreadAlerts.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => markAllAsRead()}
                className="text-[10px] font-bold text-primary hover:text-primary-foreground hover:bg-primary gap-1 cursor-pointer h-7"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="px-4 py-2 border-b border-border bg-muted/20 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                filter === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                filter === 'unread' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Unread ({unreadAlerts.length})
            </button>
          </div>

          {/* Alerts List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {displayedAlerts.length > 0 ? (
              displayedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => !alert.read && markAsRead(alert.id)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left ${getAlertBg(
                    alert.type,
                    alert.read
                  )}`}
                >
                  <div className="mt-0.5 flex-shrink-0">{getAlertIcon(alert.type)}</div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs block truncate ${alert.read ? 'font-semibold text-muted-foreground' : 'font-extrabold text-foreground'}`}>
                        {alert.title}
                      </span>
                      {!alert.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className={`text-[10px] leading-relaxed break-words ${alert.read ? 'text-muted-foreground/85' : 'text-foreground/90 font-medium'}`}>
                      {alert.message}
                    </p>
                    <span className="text-[8px] text-muted-foreground font-semibold block pt-1">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <Inbox className="h-8 w-8 text-muted-foreground/45 mb-2 stroke-1" />
                <span className="text-xs font-bold text-muted-foreground">No notifications</span>
                <p className="text-[10px] text-muted-foreground/80 font-semibold mt-0.5">
                  You are all caught up!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default AlertDropdown;
