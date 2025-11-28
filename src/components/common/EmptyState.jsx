// src/components/common/EmptyState.jsx
import { motion } from 'framer-motion';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {Icon && (
        <div className="w-20 h-20 rounded-full bg-[#F7F7F7] flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-[#B0BEC5]" />
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-[#26323B] mb-2">{title}</h3>
      
      {description && (
        <p className="text-[#455A64] max-w-md mb-6">{description}</p>
      )}
      
      {action && actionLabel && (
        <Button onClick={action}>{actionLabel}</Button>
      )}
    </motion.div>
  );
}