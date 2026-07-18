import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { useToastStore } from '../hooks/useToast';
import { Button } from './Button';

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none items-center">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onClose }) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />,
    info: <Info className="h-5 w-5 text-info flex-shrink-0" />
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card shadow-lg animate-slide-down text-left pointer-events-auto w-full">
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 flex flex-col gap-0.5">
        {toast.title && <h4 className="text-sm font-semibold text-foreground">{toast.title}</h4>}
        <p className="text-xs text-muted-foreground font-medium">{toast.message}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="h-6 w-6 rounded-full hover:bg-muted p-0 flex-shrink-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
