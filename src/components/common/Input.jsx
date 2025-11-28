// src/components/common/Input.jsx
import { forwardRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const Input = forwardRef(({
  className,
  type = 'text',
  label,
  error,
  helperText,
  icon: Icon,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#455A64] mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0BEC5]">
            <Icon className="w-5 h-5" />
          </div>
        )}
        
        <input
          ref={ref}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg border border-[#B0BEC5] bg-white',
            'text-[#26323B] placeholder-[#B0BEC5]',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[#455A64] focus:border-transparent',
            'disabled:bg-[#F7F7F7] disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500',
            Icon && 'pl-10',
            isPassword && 'pr-10',
            className
          )}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0BEC5] hover:text-[#455A64] transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
        
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={cn(
          'mt-1.5 text-sm',
          error ? 'text-red-500' : 'text-[#B0BEC5]'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;