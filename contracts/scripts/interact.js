const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  // Load environment variables
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL || 'https://dream-rpc.somnia.network';
  const contractAddress = process.env.CONTRACT_ADDRESS || '0xDdc49E1bA14E64c824B7eDF8924572618fe100AF';
  
  if (!privateKey) {
    throw new Error('PRIVATE_KEY not set in .env file');
  }
  
  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log('🧪 Testing Governance contract...');
  console.log('📍 Contract address:', contractAddress);
  console.log('👤 Tester address:', wallet.address);
  
  // Load contract ABI from deployment artifact
  const artifactPath = path.join(__dirname, '../out/Governance.sol/Governance.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abi = artifact.abi;
  
  // Create contract instance
  const governance = new ethers.Contract(contractAddress, abi, wallet);
  
  // Test 1: Get proposal count
  console.log('\n📊 Test 1: Get proposal count');
  try {
    const proposalCount = await governance.getProposalCount();
    console.log('✅ Proposal count:', proposalCount.toString());
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Test 2: Get quorum threshold
  console.log('\n📊 Test 2: Get quorum threshold');
  try {
    const quorumThreshold = await governance.quorumThreshold();
    console.log('✅ Quorum threshold:', quorumThreshold.toString() + '%');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Test 3: Get voting period
  console.log('\n📊 Test 3: Get voting period');
  try {
    const votingPeriod = await governance.votingPeriod();
    console.log('✅ Voting period:', votingPeriod.toString(), 'seconds (' + (Number(votingPeriod) / 86400) + ' days)');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Test 4: Set voting power (for testing)
  console.log('\n📊 Test 4: Set voting power for tester');
  try {
    // Use raw token amount (not wei) - contract uses raw amounts
    const votingPower = 1000n; // 1000 tokens (raw, not in wei)
    const tx = await governance.setVotingPower(wallet.address, votingPower);
    console.log('⏳ Transaction sent:', tx.hash);
    await tx.wait();
    console.log('✅ Voting power set to:', votingPower.toString(), 'tokens');
    
    // Verify voting power
    const power = await governance.votingPower(wallet.address);
    console.log('✅ Verified voting power:', power.toString(), 'tokens');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Test 5: Create a test proposal
  console.log('\n📊 Test 5: Create test proposal');
  try {
    const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days from now
    const tx = await governance.createProposal(
      'Test Proposal',
      'This is a test proposal created by the interaction script',
      deadline
    );
    console.log('⏳ Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Proposal created!');
    
    // Get the proposal ID from events
    const proposalCreatedEvent = receipt.logs.find(log => {
      try {
        const parsed = governance.interface.parseLog(log);
        return parsed && parsed.name === 'ProposalCreated';
      } catch {
        return false;
      }
    });
    
    if (proposalCreatedEvent) {
      const parsed = governance.interface.parseLog(proposalCreatedEvent);
      const proposalId = parsed.args.proposalId;
      console.log('✅ Proposal ID:', proposalId.toString());
      
      // Get proposal details
      const proposal = await governance.getProposal(proposalId);
      console.log('\n📋 Proposal details:');
      console.log('   Title:', proposal.title);
      console.log('   Description:', proposal.description);
      console.log('   Proposer:', proposal.proposer);
      console.log('   Deadline:', new Date(Number(proposal.deadline) * 1000).toISOString());
      console.log('   Votes For:', proposal.votesFor.toString());
      console.log('   Votes Against:', proposal.votesAgainst.toString());
      
      // Test 6: Vote on proposal
      console.log('\n📊 Test 6: Vote on proposal');
      const voteTx = await governance.vote(proposalId, true); // Vote for
      console.log('⏳ Vote transaction sent:', voteTx.hash);
      await voteTx.wait();
      console.log('✅ Vote cast successfully!');
      
      // Check quorum
      const [currentQuorum, requiredQuorum] = await governance.getQuorum(proposalId);
      const totalVotingPower = await governance.totalVotingPower();
      const totalVotes = proposal.votesFor + proposal.votesAgainst;
      
      console.log('\n📊 Quorum status:');
      console.log('   Total Votes:', totalVotes.toString());
      console.log('   Total Voting Power:', totalVotingPower.toString());
      console.log('   Current:', currentQuorum.toString() + '%');
      console.log('   Required:', requiredQuorum.toString() + '%');
      console.log('   Reached:', await governance.checkQuorum(proposalId) ? '✅ Yes' : '❌ No');
      
      // Show calculation details
      if (totalVotingPower > 0n) {
        const exactPercentage = Number(totalVotes * 10000n / totalVotingPower) / 100;
        console.log('   Exact Percentage:', exactPercentage.toFixed(2) + '%');
        const neededForQuorum = (Number(totalVotingPower) * Number(requiredQuorum)) / 100;
        console.log('   Needed for quorum:', Math.ceil(neededForQuorum).toLocaleString(), 'tokens');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n✅ Contract interaction tests completed!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  });

