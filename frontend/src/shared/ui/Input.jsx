import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { Eye, EyeOff } from 'lucide-react';

export const Input = React.forwardRef(
  ({ className, type = 'text', label, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={cn(
              'flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
              isPassword && 'pr-10',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            {...props}
            onChange={(e) => {
              let val = e.target.value;
              const isPhone = type === 'tel' || (label && /phone|mobile|contact/i.test(label));
              const isEmail = type === 'email' || (label && /email/i.test(label));

              if (isPhone) {
                val = val.replace(/\D/g, ''); // keep only numeric values
                e.target.value = val;
              } else if (isEmail) {
                val = val.toLowerCase(); // enforce lowercase email
                e.target.value = val;
              }

              if (props.onChange) {
                props.onChange(e);
              }
            }}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && <span className="text-xs text-destructive font-medium mt-0.5">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

