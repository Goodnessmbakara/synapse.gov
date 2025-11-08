import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import ProposalCard from '../components/ProposalCard';
import { useProposalSubscription } from '../hooks/useProposals';
import { useNotifications } from '../hooks/useNotifications';

export default function Proposals() {
  const proposals = useProposalSubscription();
  const { notifications, dismissNotification } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'active' | 'passed' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'deadline' | 'votes'>('newest');

  const filteredProposals = proposals
    .filter(p => filter === 'all' || p.status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return Number(b.createdAt) - Number(a.createdAt);
        case 'deadline':
          return Number(a.deadline) - Number(b.deadline);
        case 'votes':
          const aTotal = Number(a.votesFor) + Number(a.votesAgainst);
          const bTotal = Number(b.votesFor) + Number(b.votesAgainst);
          return bTotal - aTotal;
        default:
          return 0;
      }
    });

  return (
    <Layout notifications={notifications} onDismissNotification={dismissNotification}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Proposals</h1>
          <p className="text-theme-secondary">
            Real-time governance proposals powered by Somnia Data Streams
          </p>
        </div>
        <Link to="/proposals/create" className="btn-primary">
          Create Proposal
        </Link>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'active', 'passed', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-brand-primary text-white'
                  : 'bg-theme-secondary text-theme-primary hover:bg-theme-tertiary'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-theme-secondary border border-theme-tertiary rounded-lg px-4 py-2 text-sm text-theme-primary"
        >
          <option value="newest">Newest First</option>
          <option value="deadline">Deadline Soonest</option>
          <option value="votes">Most Votes</option>
        </select>
      </div>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-theme-secondary mb-4">
            {proposals.length === 0
              ? 'No proposals yet. Create the first one!'
              : `No ${filter === 'all' ? '' : filter} proposals found.`}
          </p>
          {proposals.length === 0 && (
            <Link to="/proposals/create" className="btn-primary inline-block mt-4">
              Create First Proposal
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </Layout>
  );
}
