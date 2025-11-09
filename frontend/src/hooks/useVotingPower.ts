import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI } from '../lib/contracts';
import { useState, useEffect } from 'react';

/**
 * Hook to check and manage user's voting power
 */
export function useVotingPower() {
  const { address, isConnected } = useAccount();
  const [isSettingPower, setIsSettingPower] = useState(false);

  // Read current voting power
  const { data: votingPower, refetch: refetchVotingPower } = useReadContract({
    address: GOVERNANCE_CONTRACT_ADDRESS,
    abi: GovernanceABI,
    functionName: 'votingPower',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Write contract for setting voting power
  const { writeContract: setVotingPowerWrite, data: setPowerHash, isPending: isSettingPending } = useWriteContract();
  const { isLoading: isSettingConfirming, isSuccess: isSetPowerSuccess } = useWaitForTransactionReceipt({
    hash: setPowerHash,
  });

  // Set voting power (default: 1000 tokens for testing)
  const setVotingPower = async (power: bigint = BigInt(1000)) => {
    if (!address) return;
    
    setIsSettingPower(true);
    try {
      setVotingPowerWrite({
        address: GOVERNANCE_CONTRACT_ADDRESS,
        abi: GovernanceABI,
        functionName: 'setVotingPower',
        args: [address, power],
      });
    } catch (error) {
      console.error('Failed to set voting power:', error);
      setIsSettingPower(false);
    }
  };

  // Refetch voting power after successful set
  useEffect(() => {
    if (isSetPowerSuccess) {
      refetchVotingPower();
      setIsSettingPower(false);
    }
  }, [isSetPowerSuccess, refetchVotingPower]);

  const isLoading = isSettingPending || isSettingConfirming || isSettingPower;
  const hasVotingPower = votingPower ? BigInt(votingPower) > 0n : false;
  const powerAmount = votingPower ? BigInt(votingPower) : 0n;

  return {
    votingPower: powerAmount,
    hasVotingPower,
    setVotingPower,
    isLoading,
    isSettingPower: isLoading,
    refetch: refetchVotingPower,
  };
}

