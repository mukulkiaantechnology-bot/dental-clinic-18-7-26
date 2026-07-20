import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Building2, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useClinicOwnerStore } from '../../store/clinicOwnerStore';
import { Button } from '../../shared/ui/Button';
import { AlertDropdown } from '../../shared/ui/AlertDropdown';

export function ClinicHeader({ onMenuClick }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const settings = useClinicOwnerStore((state) => state.settings);

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
    <header className="h-16 border-b border-border bg-card text-foreground px-4 md:px-6 flex items-center justify-between z-40 select-none flex-shrink-0">
      {/* Scoped Clinic Profile Context */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer focus:outline-none"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand Logo for Mobile Header */}
        <div className="md:hidden bg-primary text-primary-foreground p-1.5 rounded-lg flex-shrink-0">
          <Building2 className="h-4.5 w-4.5" />
        </div>

        <div className="bg-primary/10 text-primary p-2 rounded-lg hidden sm:block">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="text-left">
          <h3 className="text-xs md:text-sm font-extrabold text-foreground leading-none truncate max-w-[120px] sm:max-w-none">{settings.name}</h3>
          <span className="text-[9px] md:text-[10px] text-muted-foreground font-semibold block mt-1 truncate max-w-[150px] sm:max-w-none">{settings.address} &bull; {settings.hours}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Notifications */}
        <AlertDropdown />

        {/* Theme Switcher */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <div className="h-6 w-px bg-border my-auto mx-0.5 sm:mx-1" />

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
              {user.role ? user.role.replace('_', ' ') : 'Clinic Owner'} Console
            </p>
          </div>
        </div>

        {/* Log Out */}
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
  );
}
export default ClinicHeader;
