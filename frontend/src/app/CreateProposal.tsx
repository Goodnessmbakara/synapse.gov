import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI } from '../lib/contracts';
import { useNotifications } from '../hooks/useNotifications';

export default function CreateProposal() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { notifications, dismissNotification, addNotification } = useNotifications();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

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

    setIsSubmitting(true);
    
    try {
      writeContract({
        address: GOVERNANCE_CONTRACT_ADDRESS,
        abi: GovernanceABI,
        functionName: 'createProposal',
        args: [title, description, BigInt(deadlineTimestamp)],
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

  if (isSuccess) {
    addNotification({
      type: 'proposal_created',
      title: 'Proposal Created',
      message: 'Your proposal has been created successfully!',
      link: '/proposals',
    });
    navigate('/proposals');
  }

  const isLoading = isPending || isConfirming || isSubmitting;

  return (
    <Layout notifications={notifications} onDismissNotification={dismissNotification}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-theme-primary">Create Proposal</h1>
        
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

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/proposals')}
                className="btn-secondary flex-1"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
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

