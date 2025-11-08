// TypeScript types for SynapseGov

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  votesFor: bigint;
  votesAgainst: bigint;
  quorumThreshold: bigint;
  currentQuorum: bigint;
  deadline: bigint;
  status: ProposalStatus;
  createdAt: bigint;
  totalVotingPower: bigint;
}

export type ProposalStatus = 'active' | 'passed' | 'failed' | 'executed';

export interface Vote {
  proposalId: string;
  voter: string;
  support: boolean;
  votingPower: bigint;
  timestamp: bigint;
  txHash: string;
}

export interface QuorumStatus {
  current: bigint;
  required: bigint;
  reached: boolean;
}

export interface ActivityEvent {
  eventId: string;
  eventType: ActivityEventType;
  proposalId: string;
  user: string;
  data: Record<string, any>;
  timestamp: bigint;
}

export type ActivityEventType = 
  | 'proposal_created'
  | 'vote_cast'
  | 'quorum_reached'
  | 'proposal_passed'
  | 'proposal_failed'
  | 'proposal_executed';

export interface User {
  address: string;
  votingPower: bigint;
  delegate?: string;
  votes: Vote[];
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string;
}

export type NotificationType = 
  | 'proposal_created'
  | 'vote_cast'
  | 'quorum_reached'
  | 'proposal_status_changed'
  | 'deadline_approaching';

