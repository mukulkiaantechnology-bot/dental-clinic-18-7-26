import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Sun, Moon, LogOut, Activity, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { FrontDeskSidebar } from './FrontDeskSidebar';
import { Button } from '../../shared/ui/Button';
import { SystemStatusBar } from '../../shared/ui/SystemStatusBar';
import { AlertDropdown } from '../../shared/ui/AlertDropdown';

export function FrontDeskLayout({ children }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('hms_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('hms_theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <SystemStatusBar />
      <div className="flex-1 flex overflow-hidden bg-background text-foreground select-none">
      {/* Sidebar (Desktop aside + Mobile slide-in drawer) */}
      <FrontDeskSidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile-Responsive Header */}
        <header className="h-16 border-b border-border bg-card text-foreground px-4 sm:px-6 flex items-center justify-between z-20 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3 flex-1 overflow-hidden">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer focus:outline-none"
              title="Open Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Brand Logo for Mobile Header */}
            <div className="md:hidden bg-primary text-primary-foreground p-1.5 rounded-lg flex-shrink-0">
              <Activity className="h-4.5 w-4.5" />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold pl-1 md:pl-2 truncate">
              <span>Clinic context:</span>
              <strong className="text-foreground truncate">{user?.clinic?.name || 'Vance Dental HQ'}</strong>
            </div>
          </div>

          {/* Right hand controls */}
          <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
            {/* Notifications */}
            <AlertDropdown />

            {/* Theme switcher */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </Button>

            <div className="h-6 w-px bg-border my-auto mx-0.5" />

            {/* User Details */}
            <div className="flex items-center gap-2 text-left hidden sm:flex">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover border border-border"
              />
              <div className="leading-tight">
                <h4 className="text-xs font-bold text-foreground">{user.name}</h4>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-extrabold">
                  {user.role ? user.role.replace('_', ' ') : 'Front Desk'} Console
                </p>
              </div>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-9 px-2.5 sm:px-3 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline font-semibold">Sign Out</span>
            </Button>
          </div>
        </header>

        {/* Scrollable Work Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
          <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      </div>
      
    </div>
  );
}
export default FrontDeskLayout;
