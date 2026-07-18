import { useState, useEffect } from 'react';
import { ClinicSidebar } from './ClinicSidebar';
import { ClinicHeader } from './ClinicHeader';
import { SystemStatusBar } from '../../shared/ui/SystemStatusBar';
import { Outlet } from 'react-router-dom';
import { useClinicOwnerStore } from '../../store/clinicOwnerStore';

export function ClinicOwnerLayout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const fetchClinicSettings = useClinicOwnerStore((state) => state.fetchClinicSettings);

  useEffect(() => {
    fetchClinicSettings();
  }, [fetchClinicSettings]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <SystemStatusBar />
      <div className="flex-1 flex overflow-hidden bg-background text-foreground">
        {/* Clinic Owner Collapsible Sidebar (Drawer on mobile) */}
        <ClinicSidebar 
          isMobileOpen={isMobileSidebarOpen} 
          onClose={() => setIsMobileSidebarOpen(false)} 
        />

        {/* Primary Work Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scoped Clinic Header with Hamburger menu */}
          <ClinicHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />

          {/* Scrollable Workspace Container */}
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
export default ClinicOwnerLayout;

