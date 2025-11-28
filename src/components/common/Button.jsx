// src/components/common/Button.jsx
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Button = forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  children,
  icon: Icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-[#26323B] text-white hover:bg-[#455A64] active:bg-[#26323B]',
    secondary: 'bg-[#F7F7F7] text-[#26323B] hover:bg-[#B0BEC5] active:bg-[#F7F7F7]',
    outline: 'border-2 border-[#26323B] text-[#26323B] hover:bg-[#26323B] hover:text-white',
    ghost: 'text-[#455A64] hover:bg-[#F7F7F7]',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[#455A64] focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
        </>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;