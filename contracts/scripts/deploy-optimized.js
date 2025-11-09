const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  // Load environment variables
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL || 'https://dream-rpc.somnia.network';
  const explorerUrl = process.env.EXPLORER_URL || 'https://explorer.somnia.network';
  
  if (!privateKey) {
    throw new Error('PRIVATE_KEY not set in .env file');
  }
  
  // Create provider and wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log('🚀 Deploying GovernanceOptimized contract...');
  console.log('📡 RPC URL:', rpcUrl);
  console.log('👤 Deployer address:', wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'SOM');
  
  if (balance === 0n) {
    console.warn('⚠️  Warning: Account has zero balance. You may need testnet tokens.');
  }
  
  // Load compiled contract artifacts from Foundry
  const artifactPath = path.join(__dirname, '../out/GovernanceOptimized.sol/GovernanceOptimized.json');
  
  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      `Contract artifact not found at ${artifactPath}\n` +
      'Please compile the contract first: forge build'
    );
  }
  
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const bytecode = artifact.bytecode.object;
  const abi = artifact.abi;
  
  console.log('✅ Contract artifact loaded');
  
  // Configuration from environment or defaults
  const quorumThreshold = parseInt(process.env.QUORUM_THRESHOLD || '50'); // 50%
  const votingPeriod = parseInt(process.env.VOTING_PERIOD || '604800'); // 7 days in seconds
  
  console.log('⚙️  Configuration:');
  console.log('   Quorum Threshold:', quorumThreshold + '%');
  console.log('   Voting Period:', votingPeriod, 'seconds (' + (votingPeriod / 86400) + ' days)');
  
  // Create contract factory
  const GovernanceFactory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  console.log('\n📤 Deploying optimized contract...');
  
  // Deploy contract
  const governance = await GovernanceFactory.deploy(
    quorumThreshold,
    votingPeriod
  );
  
  console.log('⏳ Waiting for deployment transaction...');
  console.log('   Transaction hash:', governance.deploymentTransaction()?.hash);
  
  await governance.waitForDeployment();
  
  const address = await governance.getAddress();
  
  console.log('\n✅ GovernanceOptimized contract deployed successfully!');
  console.log('📍 Contract address:', address);
  console.log('🔍 Explorer:', `${explorerUrl}/address/${address}`);
  
  // Save deployment info
  const deploymentInfo = {
    address,
    network: 'Somnia Testnet',
    rpcUrl,
    explorerUrl: `${explorerUrl}/address/${address}`,
    deployer: wallet.address,
    quorumThreshold,
    votingPeriod,
    deployedAt: new Date().toISOString(),
    transactionHash: governance.deploymentTransaction()?.hash,
    contractType: 'GovernanceOptimized',
    version: '2.0'
  };
  
  const deploymentPath = path.join(__dirname, '../deployment-optimized.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('💾 Deployment info saved to:', deploymentPath);
  
  // Also save ABI for frontend
  const abiPath = path.join(__dirname, '../abi-optimized.json');
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  console.log('💾 ABI saved to:', abiPath);
  
  console.log('\n📝 Next steps:');
  console.log('1. Update frontend/.env with: VITE_CONTRACT_ADDRESS=' + address);
  console.log('2. Update frontend/src/lib/contracts.ts with new ABI');
  console.log('3. Update frontend to read title/description from events');
  console.log('4. Verify contract on explorer');
  console.log('5. Test contract interaction');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  });

