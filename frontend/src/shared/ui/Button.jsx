import React from 'react';
import { cn } from '../utils/cn';

export const Button = React.forwardRef(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          // Variants
          variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm focus:ring-primary',
          variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-muted focus:ring-ring',
          variant === 'outline' && 'border border-border bg-transparent hover:bg-secondary hover:text-secondary-foreground focus:ring-ring',
          variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm focus:ring-destructive',
          variant === 'ghost' && 'bg-transparent text-foreground hover:bg-secondary focus:ring-ring',
          // Sizes
          size === 'xs' && 'h-7 px-2.5 text-[10px]',
          size === 'sm' && 'h-8 px-3 text-xs',
          size === 'md' && 'h-10 px-4 text-sm',
          size === 'lg' && 'h-11 px-8 text-base',
          size === 'icon' && 'h-10 w-10 p-0',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
