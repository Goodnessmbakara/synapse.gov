# SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Governance
 * @dev Governance contract for SynapseGov - Real-time DAO governance platform
 */
contract Governance {
    struct Proposal {
        uint256 id;
        string title;
        string description;
        address proposer;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        uint256 createdAt;
    }
    
    struct Vote {
        address voter;
        bool support;
        uint256 votingPower;
        uint256 timestamp;
    }
    
    // State variables
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(uint256 => address[]) public voters;
    mapping(address => uint256) public votingPower;
    
    uint256 public proposalCount;
    uint256 public quorumThreshold; // Percentage (e.g., 50 = 50%)
    uint256 public votingPeriod; // Duration in seconds
    uint256 public totalVotingPower;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 deadline
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votingPower
    );
    
    event QuorumReached(uint256 indexed proposalId);
    
    event ProposalExecuted(uint256 indexed proposalId);
    
    // Constructor
    constructor(
        uint256 _quorumThreshold,
        uint256 _votingPeriod
    ) {
        quorumThreshold = _quorumThreshold;
        votingPeriod = _votingPeriod;
        totalVotingPower = 1000000; // Example: 1M tokens
    }
    
    // Create proposal
    function createProposal(
        string memory title,
        string memory description,
        uint256 deadline
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(bytes(description).length > 0, "Description required");
        require(deadline > block.timestamp, "Deadline must be in future");
        require(votingPower[msg.sender] > 0, "No voting power");
        
        uint256 proposalId = proposalCount++;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            title: title,
            description: description,
            proposer: msg.sender,
            votesFor: 0,
            votesAgainst: 0,
            deadline: deadline,
            executed: false,
            createdAt: block.timestamp
        });
        
        emit ProposalCreated(proposalId, msg.sender, title, deadline);
        
        return proposalId;
    }
    
    // Vote on proposal
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.id == proposalId, "Proposal does not exist");
        require(block.timestamp < proposal.deadline, "Voting period ended");
        require(!proposal.executed, "Proposal already executed");
        require(votes[proposalId][msg.sender].voter == address(0), "Already voted");
        require(votingPower[msg.sender] > 0, "No voting power");
        
        uint256 power = votingPower[msg.sender];
        
        votes[proposalId][msg.sender] = Vote({
            voter: msg.sender,
            support: support,
            votingPower: power,
            timestamp: block.timestamp
        });
        
        voters[proposalId].push(msg.sender);
        
        if (support) {
            proposal.votesFor += power;
        } else {
            proposal.votesAgainst += power;
        }
        
        emit VoteCast(proposalId, msg.sender, support, power);
        
        // Check quorum
        if (checkQuorum(proposalId)) {
            emit QuorumReached(proposalId);
        }
    }
    
    // Check quorum
    function checkQuorum(uint256 proposalId) public view returns (bool) {
        Proposal memory proposal = proposals[proposalId];
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        uint256 quorumPercentage = (totalVotes * 100) / totalVotingPower;
        
        return quorumPercentage >= quorumThreshold;
    }
    
    // Get quorum status
    function getQuorum(uint256 proposalId) 
        external view returns (uint256 current, uint256 required) {
        Proposal memory proposal = proposals[proposalId];
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        current = (totalVotes * 100) / totalVotingPower;
        required = quorumThreshold;
    }
    
    // Execute proposal
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.id == proposalId, "Proposal does not exist");
        require(block.timestamp >= proposal.deadline, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        require(checkQuorum(proposalId), "Quorum not reached");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal failed");
        
        proposal.executed = true;
        
        emit ProposalExecuted(proposalId);
        
        // Here you would execute the proposal logic
        // For hackathon, this is a placeholder
    }
    
    // View functions
    function getProposal(uint256 proposalId) 
        external view returns (Proposal memory) {
        return proposals[proposalId];
    }
    
    function getProposalCount() external view returns (uint256) {
        return proposalCount;
    }
    
    function hasVoted(uint256 proposalId, address voter) 
        external view returns (bool) {
        return votes[proposalId][voter].voter != address(0);
    }
    
    function getVote(uint256 proposalId, address voter) 
        external view returns (Vote memory) {
        return votes[proposalId][voter];
    }
    
    function getVoters(uint256 proposalId) 
        external view returns (address[] memory) {
        return voters[proposalId];
    }
    
    // Set voting power (for testing/demo purposes)
    function setVotingPower(address voter, uint256 power) external {
        // In production, this would be restricted to admin or token contract
        votingPower[voter] = power;
    }
}

