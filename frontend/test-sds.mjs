// Test SDS SDK Integration
// Run with: node test-sds.js

import { SDK } from '@somnia-chain/streams';
import { createPublicClient, http } from 'viem';
import { defineChain } from 'viem';

const somniaTestnet = defineChain({
  id: 123456,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia',
    symbol: 'SOM',
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network'],
    },
  },
});

async function testSDK() {
  console.log('🧪 Testing SDS SDK Integration...\n');

  try {
    // Step 1: Create public client
    console.log('1️⃣ Creating public client...');
    const publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: http('https://dream-rpc.somnia.network'),
    });
    console.log('✅ Public client created\n');

    // Step 2: Initialize SDK
    console.log('2️⃣ Initializing SDK...');
    const sdk = new SDK({
      public: publicClient,
    });
    console.log('✅ SDK initialized\n');

    // Step 3: Test schema ID computation
    console.log('3️⃣ Testing schema ID computation...');
    const testSchema = 'bytes32 id, string title';
    try {
      const schemaId = await sdk.streams.computeSchemaId(testSchema);
      console.log('✅ Schema ID computed:', schemaId);
    } catch (error) {
      console.log('⚠️  Schema ID computation:', error.message);
      console.log('   This might require network connection or different API');
    }
    console.log('');

    // Step 4: Check SDK methods
    console.log('4️⃣ Checking available SDK methods...');
    console.log('   SDK.streams:', typeof sdk.streams);
    if (sdk.streams) {
      console.log('   Available methods:', Object.keys(sdk.streams));
    }
    console.log('');

    console.log('✅ SDK test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Check official Somnia docs for exact API');
    console.log('   2. Test subscriptions with real event IDs');
    console.log('   3. Set up publishers for contract events');
    
    return sdk;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

testSDK()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });

