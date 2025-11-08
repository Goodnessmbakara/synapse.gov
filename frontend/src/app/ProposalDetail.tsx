import { useParams, Link } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import Layout from '../components/Layout';
import VoteButton from '../components/VoteButton';
import QuorumIndicator from '../components/QuorumIndicator';
import { GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI } from '../lib/contracts';
import { useVoteSubscription } from '../hooks/useVotes';
import { useQuorumSubscription } from '../hooks/useQuorum';
import { useNotifications } from '../hooks/useNotifications';
import { truncateAddress, formatTimestamp, timeUntil } from '../lib/utils';
import type { Proposal } from '../types';

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const { notifications, dismissNotification, addNotification } = useNotifications();
  
  // Fetch proposal from contract
  const { data: proposalData } = useReadContract({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    functionName: 'getProposal',
    args: id ? [BigInt(id)] : undefined,
  });

  // Fetch quorum from contract
  const { data: quorumData } = useReadContract({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    functionName: 'getQuorum',
    args: id ? [BigInt(id)] : undefined,
  });

  // Fetch total voting power from contract
  const { data: totalVotingPower } = useReadContract({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    functionName: 'totalVotingPower',
  });

  // Real-time subscriptions
  const votes = useVoteSubscription(id || '');
  const quorumStatus = useQuorumSubscription(id || '');

  // Use contract quorum data as fallback if subscription not available
  const effectiveQuorum = quorumStatus || (quorumData ? {
    current: BigInt(quorumData[0]),
    required: BigInt(quorumData[1]),
    reached: quorumData[0] >= quorumData[1]
  } : null);

  // Convert contract data to Proposal type
  const proposal: Proposal | null = proposalData ? {
    id: id || '',
    title: proposalData.title,
    description: proposalData.description,
    proposer: proposalData.proposer,
    votesFor: proposalData.votesFor,
    votesAgainst: proposalData.votesAgainst,
    quorumThreshold: quorumData ? BigInt(quorumData[1]) : BigInt(50), // Get from contract
    currentQuorum: effectiveQuorum ? effectiveQuorum.current : BigInt(0),
    deadline: proposalData.deadline,
    status: proposalData.executed ? 'executed' : 
            Number(proposalData.deadline) < Date.now() / 1000 ? 
              (proposalData.votesFor > proposalData.votesAgainst ? 'passed' : 'failed') :
              'active',
    createdAt: proposalData.createdAt,
    totalVotingPower: totalVotingPower ? BigInt(totalVotingPower) : BigInt(1000000), // Get from contract
  } : null;

  const handleVoteSuccess = () => {
    addNotification({
      type: 'vote_cast',
      title: 'Vote Cast Successfully',
      message: 'Your vote has been recorded.',
    });
  };

  if (!proposal) {
    return (
      <Layout notifications={notifications} onDismissNotification={dismissNotification}>
        <div className="card text-center py-12">
          <p className="text-dark-text-secondary">Loading proposal...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout notifications={notifications} onDismissNotification={dismissNotification}>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/proposals"
          className="text-brand-primary hover:underline mb-6 inline-block"
        >
          ← Back to Proposals
        </Link>

        {/* Proposal Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{proposal.title}</h1>
              <div className="flex items-center gap-4 text-sm text-dark-text-secondary mb-4">
                <span>By {truncateAddress(proposal.proposer)}</span>
                <span>•</span>
                <span>Created {formatTimestamp(proposal.createdAt)}</span>
                <span>•</span>
                <span>{timeUntil(proposal.deadline)} left</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              proposal.status === 'passed' ? 'bg-status-success/20 text-status-success' :
              proposal.status === 'failed' ? 'bg-status-error/20 text-status-error' :
              proposal.status === 'executed' ? 'bg-brand-primary/20 text-brand-primary' :
              'bg-status-warning/20 text-status-warning'
            }`}>
              {proposal.status}
            </span>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-dark-text-secondary whitespace-pre-wrap">
              {proposal.description}
            </p>
          </div>
        </div>

        {/* Voting Section */}
        {proposal.status === 'active' && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Cast Your Vote</h2>
            <VoteButton proposal={proposal} onVoteSuccess={handleVoteSuccess} />
          </div>
        )}

        {/* Quorum Indicator */}
        {effectiveQuorum && (
          <div className="card mb-6">
            <QuorumIndicator quorum={effectiveQuorum} />
          </div>
        )}

        {/* Vote Breakdown */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Vote Breakdown</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-2xl font-bold text-status-success mb-2">
                {proposal.votesFor.toString()}
              </div>
              <div className="text-sm text-dark-text-secondary">Votes For</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-status-error mb-2">
                {proposal.votesAgainst.toString()}
              </div>
              <div className="text-sm text-dark-text-secondary">Votes Against</div>
            </div>
          </div>

          {/* Recent Votes */}
          {votes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Recent Votes</h3>
              <div className="space-y-2">
                {votes.slice(0, 10).map((vote, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm py-2 border-b border-dark-bg-tertiary last:border-0"
                  >
                    <span className="font-mono text-xs">
                      {truncateAddress(vote.voter)}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className={vote.support ? 'text-status-success' : 'text-status-error'}>
                        {vote.support ? 'For' : 'Against'}
                      </span>
                      <span className="text-dark-text-secondary text-xs">
                        {formatTimestamp(vote.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
