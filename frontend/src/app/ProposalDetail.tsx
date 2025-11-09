import { useParams, Link } from 'react-router-dom';
import { useReadContract, usePublicClient } from 'wagmi';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import VoteButton from '../components/VoteButton';
import QuorumIndicator from '../components/QuorumIndicator';
import { GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI } from '../lib/contracts';
import { getProposalMetadata } from '../lib/proposal-metadata';
import { useVoteSubscription } from '../hooks/useVotes';
import { useQuorumSubscription } from '../hooks/useQuorum';
import { useNotifications } from '../hooks/useNotifications';
import { truncateAddress, formatTimestamp, timeUntil } from '../lib/utils';
import type { Proposal } from '../types';

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const { notifications, dismissNotification, addNotification } = useNotifications();
  const publicClient = usePublicClient();
  const [metadata, setMetadata] = useState<{ title: string; description: string } | null>(null);
  
  // Fetch proposal from contract
  const { data: proposalData } = useReadContract({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    functionName: 'getProposal',
    args: id ? [BigInt(id)] : undefined,
  });

  // Fetch metadata (title/description) from events
  useEffect(() => {
    if (!publicClient || !id) return;
    
    const fetchMetadata = async () => {
      const meta = await getProposalMetadata(publicClient, BigInt(id));
      if (meta) {
        setMetadata(meta);
      }
    };
    
    fetchMetadata();
  }, [publicClient, id]);

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
    title: metadata?.title || '', // Get from events
    description: metadata?.description || '', // Get from events
    proposer: proposalData.proposer,
    votesFor: BigInt(proposalData.votesFor),
    votesAgainst: BigInt(proposalData.votesAgainst),
    quorumThreshold: quorumData ? BigInt(quorumData[1]) : BigInt(50),
    currentQuorum: effectiveQuorum ? effectiveQuorum.current : BigInt(0),
    deadline: BigInt(proposalData.deadline),
    status: proposalData.executed ? 'executed' : 
            Number(proposalData.deadline) < Date.now() / 1000 ? 
              (Number(proposalData.votesFor) > Number(proposalData.votesAgainst) ? 'passed' : 'failed') :
              'active',
    createdAt: BigInt(proposalData.createdAt),
    totalVotingPower: totalVotingPower ? BigInt(totalVotingPower) : BigInt(1000000),
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
          className="text-brand-primary hover:underline mb-4 sm:mb-6 inline-block text-sm sm:text-base"
        >
          ← Back to Proposals
        </Link>

        {/* Proposal Header */}
        <div className="card mb-6 p-4 sm:p-6">
          {/* Title and Status Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold break-words flex-1">{proposal.title}</h1>
            <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 ${
              proposal.status === 'passed' ? 'bg-status-success/20 text-status-success' :
              proposal.status === 'failed' ? 'bg-status-error/20 text-status-error' :
              proposal.status === 'executed' ? 'bg-brand-primary/20 text-brand-primary' :
              'bg-status-warning/20 text-status-warning'
            }`}>
              {proposal.status}
            </span>
          </div>

          {/* Metadata Section */}
          <div className="space-y-2 mb-6 pb-4 border-b border-dark-bg-tertiary">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-dark-text-secondary">
              <span className="font-medium">By {truncateAddress(proposal.proposer)}</span>
              <span className="text-dark-text-secondary/60">•</span>
              <span>Created {formatTimestamp(proposal.createdAt)}</span>
              <span className="text-dark-text-secondary/60">•</span>
              <span className="font-medium">{timeUntil(proposal.deadline)} left</span>
            </div>
          </div>

          {/* Description */}
          {proposal.description && (
            <div className="prose prose-invert max-w-none">
              <p className="text-base text-brand-primary leading-relaxed whitespace-pre-wrap">
                {proposal.description}
              </p>
            </div>
          )}
        </div>

        {/* Voting Section */}
        {proposal.status === 'active' && (
          <div className="card mb-6 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Cast Your Vote</h2>
            <VoteButton proposal={proposal} onVoteSuccess={handleVoteSuccess} />
          </div>
        )}

        {/* Quorum Indicator */}
        {effectiveQuorum && (
          <div className="card mb-6 p-4 sm:p-6">
            <QuorumIndicator quorum={effectiveQuorum} />
          </div>
        )}

        {/* Vote Breakdown */}
        <div className="card mb-6 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Vote Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
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
            <div className="overflow-x-auto">
              <h3 className="text-sm font-semibold mb-3">Recent Votes</h3>
              <div className="space-y-2 min-w-0">
                {votes.slice(0, 10).map((vote, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm py-2 border-b border-dark-bg-tertiary last:border-0"
                  >
                    <span className="font-mono text-xs break-all sm:break-normal">
                      {truncateAddress(vote.voter)}
                    </span>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <span className={`whitespace-nowrap ${vote.support ? 'text-status-success' : 'text-status-error'}`}>
                        {vote.support ? 'For' : 'Against'}
                      </span>
                      <span className="text-dark-text-secondary text-xs whitespace-nowrap">
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
