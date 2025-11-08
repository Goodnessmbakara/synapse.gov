// Utility functions

export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatEther(wei: bigint | string, decimals = 4): string {
  const weiBigInt = typeof wei === 'string' ? BigInt(wei) : wei;
  const ether = Number(weiBigInt) / 1e18;
  return ether.toFixed(decimals);
}

export function formatTimestamp(timestamp: bigint | number): string {
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  const date = new Date(ts * 1000);
  return date.toLocaleString();
}

export function timeUntil(timestamp: bigint | number): string {
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  const now = Math.floor(Date.now() / 1000);
  const diff = ts - now;
  
  if (diff < 0) return 'Ended';
  
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function calculateQuorumPercentage(
  votesFor: bigint,
  votesAgainst: bigint,
  totalVotingPower: bigint
): number {
  const totalVotes = votesFor + votesAgainst;
  if (totalVotingPower === 0n) return 0;
  return Number((totalVotes * 100n) / totalVotingPower);
}

export function getProposalStatus(
  deadline: bigint,
  executed: boolean,
  votesFor: bigint,
  votesAgainst: bigint,
  quorumReached: boolean
): 'active' | 'passed' | 'failed' | 'executed' {
  if (executed) return 'executed';
  
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (now >= deadline) {
    if (quorumReached && votesFor > votesAgainst) return 'passed';
    return 'failed';
  }
  
  return 'active';
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

