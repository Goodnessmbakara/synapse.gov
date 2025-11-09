import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TransactionSuccessModal from '../components/TransactionSuccessModal';
import { GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI } from '../lib/contracts';
import { somniaTestnet } from '../lib/wagmi';
import { useNotifications } from '../hooks/useNotifications';
import { useVotingPower } from '../hooks/useVotingPower';
import { initializeSDK, publishProposalToSDS } from '../lib/sds';
import type { Proposal } from '../types';

export default function CreateProposal() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { notifications, dismissNotification, addNotification } = useNotifications();
  const { hasVotingPower } = useVotingPower();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string>('');

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const isCorrectNetwork = chainId === somniaTestnet.id;

  // Show modal when transaction succeeds and publish to SDS
  useEffect(() => {
    if (isSuccess && hash && publicClient) {
      setTransactionHash(hash);
      setShowSuccessModal(true);
      setIsSubmitting(false);
      
      // Publish proposal to SDS after successful creation
      // This bridges the contract event to SDS so subscriptions can detect it
      const publishToSDS = async () => {
        try {
          // Initialize SDS SDK with wallet client for publishing
          const sdk = await initializeSDK(publicClient, walletClient || undefined);
          if (!sdk) {
            console.debug('SDS not available, skipping publish (optional)');
            return;
          }

          // Get the proposal ID from the transaction receipt
          const receipt = await publicClient.getTransactionReceipt({ hash });
          
          // Find ProposalCreated event in the receipt
          const proposalCreatedLog = receipt.logs.find(log => {
            return log.address.toLowerCase() === GOVERNANCE_CONTRACT_ADDRESS.toLowerCase();
          });

          if (!proposalCreatedLog) {
            console.warn('ProposalCreated event not found in transaction receipt');
            return;
          }

          // Decode the event to get proposal ID
          const events = await publicClient.getContractEvents({
            address: GOVERNANCE_CONTRACT_ADDRESS,
            abi: GovernanceABI,
            eventName: 'ProposalCreated',
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber,
          });

          const proposalEvent = events.find(e => e.transactionHash === hash);
          if (!proposalEvent) {
            console.warn('ProposalCreated event not found');
            return;
          }

          const proposalId = proposalEvent.args.proposalId as bigint;
          const proposer = proposalEvent.args.proposer as string;
          const title = (proposalEvent.args.title as string) || '';
          const description = (proposalEvent.args.description as string) || '';

          // Fetch full proposal data
          const proposalData = await publicClient.readContract({
            address: GOVERNANCE_CONTRACT_ADDRESS,
            abi: GovernanceABI,
            functionName: 'getProposal',
            args: [proposalId],
          });

          const [quorumCurrent, quorumRequired] = await publicClient.readContract({
            address: GOVERNANCE_CONTRACT_ADDRESS,
            abi: GovernanceABI,
            functionName: 'getQuorum',
            args: [proposalId],
          });

          const totalVotingPower = await publicClient.readContract({
            address: GOVERNANCE_CONTRACT_ADDRESS,
            abi: GovernanceABI,
            functionName: 'totalVotingPower',
          });

          // Create proposal object
          const proposal: Proposal = {
            id: proposalId.toString(),
            title,
            description,
            proposer,
            votesFor: BigInt(proposalData.votesFor),
            votesAgainst: BigInt(proposalData.votesAgainst),
            quorumThreshold: BigInt(quorumRequired),
            currentQuorum: BigInt(quorumCurrent),
            deadline: BigInt(proposalData.deadline),
            status: 'active',
            createdAt: BigInt(proposalData.createdAt),
            totalVotingPower: BigInt(totalVotingPower),
          };

          // Publish to SDS - this emits a 'ProposalCreated' event that subscriptions can detect
          await publishProposalToSDS(sdk, proposal, proposalId);
        } catch (error: any) {
          // Don't show error to user - SDS publishing is optional
          console.debug('Failed to publish proposal to SDS (optional):', error.message);
        }
      };

      publishToSDS();
      
      // Reset form fields
      setTitle('');
      setDescription('');
      setDeadline('');
    }
  }, [isSuccess, hash, publicClient, walletClient]);

  // Get explorer URL from env or use default
  const explorerUrl = (import.meta.env.VITE_EXPLORER_URL as string) || 'https://explorer.somnia.network';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      addNotification({
        type: 'proposal_created',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet to create a proposal.',
      });
      return;
    }

    if (!isCorrectNetwork) {
      addNotification({
        type: 'proposal_created',
        title: 'Wrong Network',
        message: `Please switch to Somnia Testnet (Chain ID: ${somniaTestnet.id}) to create a proposal.`,
      });
      return;
    }

    // Check voting power before submission
    if (!hasVotingPower) {
      // Double-check voting power from contract to ensure accuracy
      try {
        if (publicClient && address) {
          const power = await publicClient.readContract({
            address: GOVERNANCE_CONTRACT_ADDRESS,
            abi: GovernanceABI,
            functionName: 'votingPower',
            args: [address],
          });
          
          if (BigInt(power) === 0n) {
            addNotification({
              type: 'proposal_created',
              title: 'No Voting Power',
              message: 'You need voting power to create proposals. Use the "Get Voting Power" banner at the top to get started.',
            });
            return;
          }
        }
      } catch (error) {
        console.error('Failed to check voting power:', error);
        // If check fails, still show error based on hook state
        addNotification({
          type: 'proposal_created',
          title: 'No Voting Power',
          message: 'You need voting power to create proposals. Use the "Get Voting Power" banner at the top to get started.',
        });
        return;
      }
    }

    if (!title.trim() || !description.trim() || !deadline) {
      addNotification({
        type: 'proposal_created',
        title: 'Validation Error',
        message: 'Please fill in all fields.',
      });
      return;
    }

    const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
    
    if (deadlineTimestamp <= Date.now() / 1000) {
      addNotification({
        type: 'proposal_created',
        title: 'Invalid Deadline',
        message: 'Deadline must be in the future.',
      });
      return;
    }

    // Warn about long strings that increase gas costs
    if (title.length > 100 || description.length > 500) {
      addNotification({
        type: 'proposal_created',
        title: 'Gas Warning',
        message: 'Long titles/descriptions increase gas costs. Consider shortening your text.',
      });
    }

    setIsSubmitting(true);
    
    try {
      // Network gas limit cap: 16,777,216 (16.7M)
      // Set a safe limit below the cap to avoid transaction failures
      const MAX_GAS_LIMIT = BigInt(15000000); // 15M gas limit
      
      writeContract({
        address: GOVERNANCE_CONTRACT_ADDRESS,
        abi: GovernanceABI,
        functionName: 'createProposal',
        args: [title, description, BigInt(deadlineTimestamp)],
        gas: MAX_GAS_LIMIT,
      });
    } catch (error) {
      console.error('Failed to create proposal:', error);
      addNotification({
        type: 'proposal_created',
        title: 'Error',
        message: 'Failed to create proposal. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  const handleViewProposals = () => {
    setShowSuccessModal(false);
    navigate('/proposals');
  };

  const isLoading = isPending || isConfirming || isSubmitting;

  return (
    <Layout notifications={notifications} onDismissNotification={dismissNotification}>
      <TransactionSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        transactionHash={transactionHash}
        explorerUrl={explorerUrl}
        onViewProposals={handleViewProposals}
      />
      
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-theme-primary">Create Proposal</h1>
        
        {!isConnected ? (
          <div className="card text-center py-12">
            <p className="text-theme-secondary mb-4">
              Please connect your wallet to create a proposal.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2 text-theme-primary">
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter proposal title"
                maxLength={200}
                className="w-full bg-theme-tertiary border border-theme-tertiary rounded-lg px-4 py-2 text-theme-primary placeholder:text-theme-secondary focus:outline-none focus:border-brand-primary"
                required
              />
              <p className="text-xs text-theme-secondary mt-1">
                {title.length}/200 characters
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2 text-theme-primary">
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your proposal in detail"
                rows={8}
                maxLength={5000}
                className="w-full bg-theme-tertiary border border-theme-tertiary rounded-lg px-4 py-2 text-theme-primary placeholder:text-theme-secondary focus:outline-none focus:border-brand-primary resize-none"
                required
              />
              <p className="text-xs text-theme-secondary mt-1">
                {description.length}/5000 characters
              </p>
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium mb-2 text-theme-primary">
                Deadline *
              </label>
              <input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-theme-tertiary border border-theme-tertiary rounded-lg px-4 py-2 text-theme-primary focus:outline-none focus:border-brand-primary"
                required
              />
              <p className="text-xs text-theme-secondary mt-1">
                Voting will end at this time
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => navigate('/proposals')}
                className="btn-secondary w-full sm:w-auto sm:flex-1"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto sm:flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Proposal'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}

