import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Building2, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useClinicStore } from '../../store/clinicStore';
import { Button } from '../../shared/ui/Button';
import { AlertDropdown } from '../../shared/ui/AlertDropdown';

export function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { clinics, selectedClinicId, setSelectedClinicId, fetchClinics } = useClinicStore();

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('hms_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    fetchClinics();
  }, []);

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

  const handleClinicChange = (e) => {
    setSelectedClinicId(e.target.value);
  };

  if (!user) return null;

  // Render clinic selection options
  const clinicOptions = [
    ...(user.role === 'super_admin' ? [{ value: 'all', label: 'All Clinics (Global View)' }] : []),
    ...clinics.map((c) => ({ value: c.id, label: c.name }))
  ];

  return (
    <header className="h-16 border-b border-border bg-card text-foreground px-4 md:px-6 flex items-center justify-between z-40 select-none flex-shrink-0">
      {/* Clinic Switcher & Mobile Menu Trigger */}
      <div className="flex items-center gap-2">
        {/* Mobile menu toggle */}
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

        <Building2 className="h-4 w-4 text-muted-foreground hidden sm:block" />
        <div className="relative">
          <select
            value={selectedClinicId}
            onChange={handleClinicChange}
            className="bg-transparent text-xs sm:text-sm font-semibold text-foreground/90 border-none outline-none pr-6 cursor-pointer focus:ring-0 focus:ring-offset-0 py-1 max-w-[150px] sm:max-w-none truncate"
          >
            {clinicOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                {opt.label}
              </option>
            ))}
          </select>
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
export default Header;
