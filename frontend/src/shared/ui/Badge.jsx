import { cn } from '../utils/cn';

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors',
        variant === 'default' && 'bg-primary/10 text-primary border-primary/20',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground border-border',
        variant === 'success' && 'bg-success/10 text-success border-success/20 dark:bg-success/20',
        variant === 'warning' && 'bg-warning/10 text-warning border-warning/20 dark:bg-warning/20',
        variant === 'destructive' && 'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20',
        variant === 'info' && 'bg-info/10 text-info border-info/20 dark:bg-info/20',
        className
      )}
      {...props}
    />
  );
}
