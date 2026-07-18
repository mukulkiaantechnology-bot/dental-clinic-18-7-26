import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({ isOpen, onClose, title, size = 'lg', children }) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'md:max-w-sm',
    md: 'md:max-w-md',
    lg: 'md:max-w-lg',
    xl: 'md:max-w-xl',
    '2xl': 'md:max-w-2xl',
    '3xl': 'md:max-w-3xl',
    '4xl': 'md:max-w-4xl',
    '5xl': 'md:max-w-5xl',
  };
  const sizeClass = sizeClasses[size] || 'md:max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className={`relative w-full h-full md:h-auto ${sizeClass} rounded-none md:rounded-xl border-none md:border border-border bg-card p-4 md:p-6 shadow-lg z-10 animate-scale-in text-left flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border flex-shrink-0">
          <h3 className="text-base md:text-lg font-extrabold text-foreground truncate">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 md:h-8 md:w-8 hover:bg-muted rounded-full cursor-pointer flex items-center justify-center">
            <X className="h-5 w-5 md:h-4 md:w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 py-4 overflow-y-auto no-scrollbar md:max-h-[70vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
export default Modal;
