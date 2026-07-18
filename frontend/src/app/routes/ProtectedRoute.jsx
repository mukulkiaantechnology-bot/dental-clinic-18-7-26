import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { hasModuleAccess } from '../../shared/utils/permissions';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../../shared/ui/Button';

export function ProtectedRoute({ module }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = hasModuleAccess(user.role, module);

  if (!hasAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in min-h-[60vh]">
        <div className="p-4 bg-destructive/10 text-destructive rounded-full mb-4 border border-destructive/20 dark:bg-destructive/20 animate-bounce">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h1>
        <p className="text-sm text-muted-foreground max-w-md mb-6 font-medium leading-relaxed">
          Your active session role (<span className="text-primary font-semibold">{user.role.replace('_', ' ')}</span>) does not have authorization to view the <span className="font-semibold">{module.replace('_', ' ')}</span> module.
        </p>
        <Button onClick={() => window.history.back()} variant="outline" className="h-10 px-5">
          Go Back
        </Button>
      </div>
    );
  }

  return <Outlet />;
}
