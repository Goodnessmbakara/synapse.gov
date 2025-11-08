import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityEvent } from '../types';
import { truncateAddress, formatTimestamp } from '../lib/utils';
import { Link } from 'react-router-dom';

interface ActivityFeedProps {
  activities: ActivityEvent[];
}

const getEventIcon = (type: ActivityEvent['eventType']) => {
  switch (type) {
    case 'proposal_created':
      return '📝';
    case 'vote_cast':
      return '🗳️';
    case 'quorum_reached':
      return '✅';
    case 'proposal_passed':
      return '🎉';
    case 'proposal_failed':
      return '❌';
    case 'proposal_executed':
      return '⚡';
    default:
      return '📌';
  }
};

const getEventColor = (type: ActivityEvent['eventType']) => {
  switch (type) {
    case 'proposal_created':
      return 'text-brand-primary';
    case 'vote_cast':
      return 'text-brand-accent';
    case 'quorum_reached':
      return 'text-status-success';
    case 'proposal_passed':
      return 'text-status-success';
    case 'proposal_failed':
      return 'text-status-error';
    case 'proposal_executed':
      return 'text-brand-primary';
    default:
      return 'text-dark-text-secondary';
  }
};

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-4">Live Activity</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {activities.map((activity) => (
            <motion.div
              key={activity.eventId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="card p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getEventIcon(activity.eventType)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${getEventColor(activity.eventType)}`}>
                      {activity.eventType.replace('_', ' ')}
                    </span>
                    <Link
                      to={`/proposals/${activity.proposalId}`}
                      className="text-xs text-brand-primary hover:underline"
                    >
                      View Proposal
                    </Link>
                  </div>
                  <div className="text-xs text-dark-text-secondary">
                    {truncateAddress(activity.user)} • {formatTimestamp(activity.timestamp)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

