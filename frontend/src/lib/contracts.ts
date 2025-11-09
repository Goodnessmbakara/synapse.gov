// Contract ABI and interaction utilities
// OPTIMIZED CONTRACT: Title and description are stored in ProposalCreated events, not in storage
// Use getProposalMetadata() from './proposal-metadata' to fetch title/description from events

import { Address } from 'viem';

export const GOVERNANCE_CONTRACT_ADDRESS = 
  (import.meta.env.VITE_CONTRACT_ADDRESS || '0x8C5Fcb19434aF9Cc255d376C04854d3fD22218A2') as Address;

export const GovernanceABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
    ],
    name: 'checkQuorum',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'title', type: 'string' },
      { internalType: 'string', name: 'description', type: 'string' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
    ],
    name: 'createProposal',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
    ],
    name: 'executeProposal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
    ],
    name: 'getProposal',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          // NOTE: title and description are NOT in storage - fetch from ProposalCreated events
          { internalType: 'address', name: 'proposer', type: 'address' },
          { internalType: 'uint128', name: 'votesFor', type: 'uint128' },
          { internalType: 'uint128', name: 'votesAgainst', type: 'uint128' },
          { internalType: 'uint64', name: 'deadline', type: 'uint64' },
          { internalType: 'uint64', name: 'createdAt', type: 'uint64' },
          { internalType: 'bool', name: 'executed', type: 'bool' },
        ],
        internalType: 'struct GovernanceOptimized.Proposal',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getProposalCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
    ],
    name: 'getQuorum',
    outputs: [
      { internalType: 'uint256', name: 'current', type: 'uint256' },
      { internalType: 'uint256', name: 'required', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { internalType: 'address', name: 'voter', type: 'address' },
    ],
    name: 'getVote',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'voter', type: 'address' },
          { internalType: 'uint128', name: 'votingPower', type: 'uint128' },
          { internalType: 'uint64', name: 'timestamp', type: 'uint64' },
          { internalType: 'bool', name: 'support', type: 'bool' },
        ],
        internalType: 'struct GovernanceOptimized.Vote',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
    ],
    name: 'getVoters',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { internalType: 'address', name: 'voter', type: 'address' },
    ],
    name: 'hasVoted',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proposalCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    name: 'proposals',
    outputs: [
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      // NOTE: title and description are NOT in storage - fetch from ProposalCreated events
      { internalType: 'address', name: 'proposer', type: 'address' },
      { internalType: 'uint128', name: 'votesFor', type: 'uint128' },
      { internalType: 'uint128', name: 'votesAgainst', type: 'uint128' },
      { internalType: 'uint64', name: 'deadline', type: 'uint64' },
      { internalType: 'uint64', name: 'createdAt', type: 'uint64' },
      { internalType: 'bool', name: 'executed', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'quorumThreshold',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'voter', type: 'address' },
      { internalType: 'uint256', name: 'power', type: 'uint256' },
    ],
    name: 'setVotingPower',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalVotingPower',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { internalType: 'bool', name: 'support', type: 'bool' },
    ],
    name: 'vote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256', name: '', type: 'uint256' },
    ],
    name: 'voters',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'votes',
    outputs: [
      { internalType: 'address', name: 'voter', type: 'address' },
      { internalType: 'uint128', name: 'votingPower', type: 'uint128' },
      { internalType: 'uint64', name: 'timestamp', type: 'uint64' },
      { internalType: 'bool', name: 'support', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'votingPeriod',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'votingPower',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'proposer', type: 'address' },
      { indexed: false, internalType: 'string', name: 'title', type: 'string' },
      { indexed: false, internalType: 'string', name: 'description', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'deadline', type: 'uint256' },
    ],
    name: 'ProposalCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'proposalId', type: 'uint256' },
    ],
    name: 'ProposalExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'proposalId', type: 'uint256' },
    ],
    name: 'QuorumReached',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'voter', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'support', type: 'bool' },
      { indexed: false, internalType: 'uint256', name: 'votingPower', type: 'uint256' },
    ],
    name: 'VoteCast',
    type: 'event',
  },
] as const;
