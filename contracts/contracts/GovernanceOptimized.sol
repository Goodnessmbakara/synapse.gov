// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GovernanceOptimized
 * @dev Gas-optimized version of Governance contract
 * 
 * KEY OPTIMIZATIONS:
 * 1. Store only essential data on-chain (no strings in storage)
 * 2. Emit full title/description in events (events are ~10x cheaper than storage)
 * 3. Use bytes32 for short titles (if needed)
 * 4. Pack structs to reduce storage slots
 * 
 * GAS SAVINGS:
 * - Storing strings: ~20,000 gas per byte
 * - Emitting events: ~375 gas per byte (log data)
 * - Savings: ~95% reduction for string storage
 */
contract GovernanceOptimized {
    struct Proposal {
        uint256 id;
        address proposer;
        uint128 votesFor;      // Packed: uint128 saves gas vs uint256
        uint128 votesAgainst;  // Packed: uint128 saves gas vs uint256
        uint64 deadline;       // Packed: uint64 sufficient for timestamps
        uint64 createdAt;      // Packed: uint64 sufficient for timestamps
        bool executed;
        // Removed: title and description (stored in events instead)
    }
    
    struct Vote {
        address voter;
        uint128 votingPower;   // Packed: uint128 saves gas
        uint64 timestamp;      // Packed: uint64 sufficient
        bool support;
    }
    
    // State variables
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(uint256 => address[]) public voters;
    mapping(address => uint256) public votingPower;
    
    uint256 public proposalCount;
    uint256 public quorumThreshold;
    uint256 public votingPeriod;
    uint256 public totalVotingPower;
    
    // Events - Store full strings here (much cheaper than storage)
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,           // Full title in event
        string description,      // Full description in event
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
    
    constructor(
        uint256 _quorumThreshold,
        uint256 _votingPeriod
    ) {
        quorumThreshold = _quorumThreshold;
        votingPeriod = _votingPeriod;
        totalVotingPower = 1000000;
    }
    
    /**
     * @dev Create proposal - optimized version
     * Title and description are emitted in events, not stored
     * This reduces gas costs by ~95% for string data
     */
    function createProposal(
        string memory title,
        string memory description,
        uint256 deadline
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(bytes(description).length > 0, "Description required");
        require(deadline > block.timestamp, "Deadline must be in future");
        require(deadline <= type(uint64).max, "Deadline exceeds maximum");
        require(votingPower[msg.sender] > 0, "No voting power");
        
        uint256 proposalId = proposalCount++;
        
        // Store only essential data (no strings)
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            votesFor: 0,
            votesAgainst: 0,
            // casting to 'uint64' is safe because deadline is validated above (<= type(uint64).max)
            // forge-lint: disable-next-line(unsafe-typecast)
            deadline: uint64(deadline),
            // casting to 'uint64' is safe because block.timestamp will never exceed uint64 (max ~year 292 billion)
            // forge-lint: disable-next-line(unsafe-typecast)
            createdAt: uint64(block.timestamp),
            executed: false
        });
        
        // Emit full strings in event (much cheaper than storage)
        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            description,
            deadline
        );
        
        return proposalId;
    }
    
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.id == proposalId, "Proposal does not exist");
        require(uint256(proposal.deadline) > block.timestamp, "Voting period ended");
        require(!proposal.executed, "Proposal already executed");
        require(votes[proposalId][msg.sender].voter == address(0), "Already voted");
        require(votingPower[msg.sender] > 0, "No voting power");
        
        uint256 power = votingPower[msg.sender];
        require(power <= type(uint128).max, "Voting power exceeds maximum");
        
        votes[proposalId][msg.sender] = Vote({
            voter: msg.sender,
            support: support,
            // casting to 'uint128' is safe because power is validated above
            // forge-lint: disable-next-line(unsafe-typecast)
            votingPower: uint128(power),
            // casting to 'uint64' is safe because block.timestamp will never exceed uint64
            // forge-lint: disable-next-line(unsafe-typecast)
            timestamp: uint64(block.timestamp)
        });
        
        voters[proposalId].push(msg.sender);
        
        if (support) {
            // Check for overflow before adding
            require(uint256(proposal.votesFor) + power <= type(uint128).max, "Votes overflow");
            // casting to 'uint128' is safe because power is validated above and overflow is checked
            // forge-lint: disable-next-line(unsafe-typecast)
            proposal.votesFor += uint128(power);
        } else {
            // Check for overflow before adding
            require(uint256(proposal.votesAgainst) + power <= type(uint128).max, "Votes overflow");
            // casting to 'uint128' is safe because power is validated above and overflow is checked
            // forge-lint: disable-next-line(unsafe-typecast)
            proposal.votesAgainst += uint128(power);
        }
        
        emit VoteCast(proposalId, msg.sender, support, power);
        
        if (checkQuorum(proposalId)) {
            emit QuorumReached(proposalId);
        }
    }
    
    function checkQuorum(uint256 proposalId) public view returns (bool) {
        Proposal memory proposal = proposals[proposalId];
        uint256 totalVotes = uint256(proposal.votesFor) + uint256(proposal.votesAgainst);
        uint256 quorumPercentage = (totalVotes * 100) / totalVotingPower;
        
        return quorumPercentage >= quorumThreshold;
    }
    
    function getQuorum(uint256 proposalId) 
        external view returns (uint256 current, uint256 required) {
        Proposal memory proposal = proposals[proposalId];
        uint256 totalVotes = uint256(proposal.votesFor) + uint256(proposal.votesAgainst);
        current = (totalVotes * 100) / totalVotingPower;
        required = quorumThreshold;
    }
    
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.id == proposalId, "Proposal does not exist");
        require(uint256(proposal.deadline) <= block.timestamp, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        require(checkQuorum(proposalId), "Quorum not reached");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal failed");
        
        proposal.executed = true;
        
        emit ProposalExecuted(proposalId);
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
    
    function setVotingPower(address voter, uint256 power) external {
        // In production, this would be restricted to admin or token contract
        // Note: We don't validate uint128 max here to allow flexibility,
        // but vote() function will validate when casting
        votingPower[voter] = power;
    }
}

