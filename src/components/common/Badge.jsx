// src/components/common/Badge.jsx
import { cn } from '../../lib/utils';

export default function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className 
}) {
  const variants = {
    default: 'bg-[#F7F7F7] text-[#455A64]',
    primary: 'bg-[#26323B] text-white',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}