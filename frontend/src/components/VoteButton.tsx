import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI } from '../lib/contracts';
import type { Proposal } from '../types';

interface VoteButtonProps {
  proposal: Proposal;
  onVoteSuccess?: () => void;
}

export default function VoteButton({ proposal, onVoteSuccess }: VoteButtonProps) {
  const { address } = useAccount();
  const [support, setSupport] = useState<boolean | null>(null);
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleVote = async (voteSupport: boolean) => {
    if (!address) return;
    
    setSupport(voteSupport);
    writeContract({
      address: GOVERNANCE_CONTRACT_ADDRESS,
      abi: GovernanceABI,
      functionName: 'vote',
      args: [BigInt(proposal.id), voteSupport],
    });
  };

  if (isSuccess && onVoteSuccess) {
    onVoteSuccess();
  }

  const isVoting = isPending || isConfirming;

  return (
    <div className="flex gap-4">
      <button
        onClick={() => handleVote(true)}
        disabled={isVoting || proposal.status !== 'active'}
        className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
          support === true
            ? 'bg-status-success text-white'
            : 'bg-dark-bg-tertiary text-dark-text-primary hover:bg-dark-bg-tertiary/80'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isVoting && support === true ? 'Voting...' : 'Vote For'}
      </button>
      
      <button
        onClick={() => handleVote(false)}
        disabled={isVoting || proposal.status !== 'active'}
        className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
          support === false
            ? 'bg-status-error text-white'
            : 'bg-dark-bg-tertiary text-dark-text-primary hover:bg-dark-bg-tertiary/80'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isVoting && support === false ? 'Voting...' : 'Vote Against'}
      </button>
    </div>
  );
}

