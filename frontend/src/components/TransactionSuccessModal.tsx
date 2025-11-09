import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionHash: string;
  explorerUrl?: string;
  onViewProposals?: () => void;
}

export default function TransactionSuccessModal({
  isOpen,
  onClose,
  transactionHash,
  explorerUrl = 'https://explorer.somnia.network',
  onViewProposals,
}: TransactionSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const explorerLink = `${explorerUrl}/tx/${transactionHash}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transactionHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-theme-secondary border border-theme-tertiary rounded-lg shadow-xl max-w-md w-full p-6 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Success Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-status-success/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-status-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center mb-2 text-theme-primary">
                Proposal Created Successfully!
              </h2>

              {/* Description */}
              <p className="text-center text-theme-secondary mb-6 text-sm sm:text-base">
                Your proposal has been submitted to the blockchain. You can view the transaction details below.
              </p>

              {/* Transaction Hash */}
              <div className="bg-theme-tertiary rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-theme-secondary uppercase">
                    Transaction Hash
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className={`text-xs transition-colors ${
                      copied 
                        ? 'text-status-success' 
                        : 'text-brand-primary hover:text-brand-primary/80'
                    }`}
                    title={copied ? 'Copied!' : 'Copy to clipboard'}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs sm:text-sm text-theme-primary break-all flex-1">
                    {transactionHash}
                  </code>
                </div>
              </div>

              {/* Explorer Link */}
              <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full mb-4 btn-primary text-center"
              >
                View on Explorer
                <svg
                  className="w-4 h-4 inline-block ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {onViewProposals && (
                  <button
                    onClick={onViewProposals}
                    className="btn-primary flex-1"
                  >
                    View Proposals
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

