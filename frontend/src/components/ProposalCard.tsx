import { motion } from 'framer-motion';
import type { Proposal } from '../types';
import { truncateAddress, timeUntil, calculateQuorumPercentage } from '../lib/utils';
import { Link } from 'react-router-dom';

interface ProposalCardProps {
  proposal: Proposal;
}

export default function ProposalCard({ proposal }: ProposalCardProps) {
  const quorumPercentage = calculateQuorumPercentage(
    proposal.votesFor,
    proposal.votesAgainst,
    proposal.totalVotingPower
  );

  const getStatusColor = () => {
    switch (proposal.status) {
      case 'passed':
        return 'bg-status-success/20 text-status-success border-status-success';
      case 'failed':
        return 'bg-status-error/20 text-status-error border-status-error';
      case 'executed':
        return 'bg-brand-primary/20 text-brand-primary border-brand-primary';
      default:
        return 'bg-status-warning/20 text-status-warning border-status-warning';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/proposals/${proposal.id}`}>
        <div className="card hover:border-brand-primary/50 transition-colors cursor-pointer p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between mb-4 gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-semibold mb-2 break-words">{proposal.title}</h3>
              <p className="text-dark-text-secondary text-sm line-clamp-2">
                {proposal.description}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor()}`}>
              {proposal.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-dark-text-secondary mb-4">
            <span>By {truncateAddress(proposal.proposer)}</span>
            <span className="hidden sm:inline">•</span>
            <span>{timeUntil(proposal.deadline)} left</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-status-success">For: {proposal.votesFor.toString()}</span>
              <span className="text-status-error">Against: {proposal.votesAgainst.toString()}</span>
            </div>
            
            <div className="w-full bg-dark-bg-tertiary rounded-full h-2">
              <div
                className="bg-brand-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(quorumPercentage, 100)}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-dark-text-secondary">
              <span>Quorum: {quorumPercentage.toFixed(1)}%</span>
              <span>Required: {Number(proposal.quorumThreshold)}%</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

