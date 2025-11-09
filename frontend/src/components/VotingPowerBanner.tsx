import { useVotingPower } from '../hooks/useVotingPower';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Banner component that shows when user has no voting power
 * Provides a button to get voting power
 */
export default function VotingPowerBanner() {
  const { hasVotingPower, setVotingPower, isLoading } = useVotingPower();

  if (hasVotingPower) {
    return null; // Don't show if user has voting power
  }

  const handleGetVotingPower = async () => {
    await setVotingPower(BigInt(1000)); // Set default 1000 tokens
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-status-warning/20 border-b border-status-warning/40 py-3 px-4"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="text-sm font-semibold text-theme-primary mb-1">
              ⚠️ No Voting Power
            </div>
            <div className="text-xs text-theme-secondary">
              You need voting power to create proposals. Click the button below to get started with 1,000 voting tokens (for testing).
            </div>
          </div>
          <button
            onClick={handleGetVotingPower}
            disabled={isLoading}
            className="btn-primary text-xs sm:text-sm px-4 py-2 bg-status-warning hover:bg-status-warning/80 text-white whitespace-nowrap disabled:opacity-50"
          >
            {isLoading ? 'Setting...' : 'Get Voting Power'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

