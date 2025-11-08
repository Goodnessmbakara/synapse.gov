import { motion } from 'framer-motion';
import type { QuorumStatus } from '../types';

interface QuorumIndicatorProps {
  quorum: QuorumStatus;
  className?: string;
}

export default function QuorumIndicator({ quorum, className = '' }: QuorumIndicatorProps) {
  const percentage = Number(quorum.current);
  const required = Number(quorum.required);
  const progress = Math.min((percentage / required) * 100, 100);

  const getColor = () => {
    if (quorum.reached) return 'bg-status-success';
    if (percentage >= required * 0.75) return 'bg-status-warning';
    if (percentage >= required * 0.5) return 'bg-brand-accent';
    return 'bg-status-error';
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Quorum Progress</span>
        <span className="text-sm text-dark-text-secondary">
          {percentage.toFixed(1)}% / {required}%
        </span>
      </div>
      
      <div className="w-full bg-dark-bg-tertiary rounded-full h-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${getColor()} rounded-full`}
        />
      </div>
      
      {quorum.reached && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-2 text-sm text-status-success font-medium flex items-center gap-2"
        >
          <span>✓</span>
          <span>Quorum Reached!</span>
        </motion.div>
      )}
    </div>
  );
}

