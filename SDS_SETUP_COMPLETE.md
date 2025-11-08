# SDS SDK Integration - Complete Guide

## ✅ Current Status

**SDK is installed and working!** (`@somnia-chain/streams` v0.1.1)

## What We Know

1. ✅ SDK can be imported and instantiated
2. ✅ SDK requires a `publicClient` from viem
3. ⚠️ `computeSchemaId` appears to call a contract function (not a direct SDK method)
4. ⚠️ `sdk.streams` has a `viem` property, suggesting it uses viem under the hood

## Step-by-Step Integration

### Step 1: SDK is Already Installed ✅

```bash
cd frontend
pnpm list @somnia-chain/streams
# Should show: @somnia-chain/streams 0.1.1
```

### Step 2: SDK Initialization (Already Done ✅)

Your code in `frontend/src/lib/sds.ts` already has the initialization:

```typescript
import { SDK } from '@somnia-chain/streams';

const sdk = new SDK({
  public: publicClient,  // From wagmi/viem
  wallet: walletClient,  // Optional, for publishing
});
```

### Step 3: Understanding the SDS Architecture

Based on the test results, SDS appears to work through:
- **Smart Contracts**: Schema computation and event registration happen on-chain
- **Viem Integration**: SDK uses viem for contract interactions
- **Event IDs**: You need to register event IDs before subscribing

### Step 4: Next Steps to Complete Integration

#### A. Find the SDS Contract Address

SDS likely has a contract on Somnia Testnet. You need to:
1. Check Somnia documentation for SDS contract address
2. Or find it in the SDK source code/types

#### B. Register Your Schemas

Before using schemas, you may need to:
1. Register them on the SDS contract
2. Get back schema IDs
3. Use those IDs for publishing/subscribing

#### C. Register Event IDs

Before subscribing, register event IDs:
- `ProposalCreated`
- `VoteCast`
- `QuorumReached`
- `ProposalExecuted`

#### D. Update Your Code

1. **Fix Schema Encoding**: Use `SchemaEncoder` from SDK instead of JSON
2. **Uncomment Publishers**: Enable publishing code in `sds-publishers.ts`
3. **Test Subscriptions**: Verify hooks receive real-time updates

### Step 5: Finding the Right API

Since the SDK API might differ from expected, you should:

1. **Check SDK Source**:
   ```bash
   cd frontend/node_modules/@somnia-chain/streams
   # Look for README, types, or source files
   ```

2. **Check Somnia Docs**:
   - Visit: https://docs.somnia.network
   - Look for "Data Streams" or "SDS" documentation
   - Check for API reference or examples

3. **Check SDK Types**:
   ```typescript
   import type { SDK } from '@somnia-chain/streams';
   // Check TypeScript definitions for available methods
   ```

### Step 6: Testing Strategy

1. **Start Simple**: Test basic SDK connection ✅ (Done)
2. **Test Schema Registration**: Try registering one schema
3. **Test Event Publishing**: Publish one test event
4. **Test Subscription**: Subscribe to one event type
5. **Full Integration**: Enable all features

## Current Code Status

### ✅ Ready to Use:
- SDK initialization (`sds.ts`)
- Connection manager (`SDSConnectionManager`)
- React hooks (`useProposalSubscription`, etc.)
- Error handling and fallbacks

### ⚠️ Needs Work:
- Schema registration (needs contract address)
- Event ID registration
- Schema encoding (use SchemaEncoder)
- Publisher code (uncomment and test)

## Recommended Action Plan

1. **Research Phase** (30 min):
   - Check Somnia official docs for SDS
   - Look for SDS contract address
   - Find API examples

2. **Setup Phase** (1 hour):
   - Configure SDS contract address
   - Register schemas
   - Register event IDs

3. **Integration Phase** (2 hours):
   - Update encoding to use SchemaEncoder
   - Uncomment and test publishers
   - Test subscriptions

4. **Testing Phase** (1 hour):
   - Test proposal creation → real-time update
   - Test voting → real-time vote count
   - Test quorum → real-time quorum update

## Quick Test Commands

```bash
# Test SDK import
cd frontend
node -e "const { SDK } = require('@somnia-chain/streams'); console.log('SDK:', SDK);"

# Run integration test
node test-sds.mjs

# Check SDK structure
node -e "const { SDK } = require('@somnia-chain/streams'); const sdk = new SDK({ public: null }); console.log('Streams:', Object.keys(sdk.streams));"
```

## Resources

- **SDK Package**: `@somnia-chain/streams@0.1.1`
- **Somnia Docs**: https://docs.somnia.network
- **RPC**: https://dream-rpc.somnia.network
- **Explorer**: https://explorer.somnia.network

## Need Help?

If you're stuck:
1. Check the SDK source code in `node_modules`
2. Look for TypeScript definitions (`.d.ts` files)
3. Check Somnia Discord/Telegram for community help
4. Review Somnia hackathon documentation

## Summary

✅ **SDK is installed and working**
⚠️ **Need to find SDS contract address and API details**
📝 **Code structure is ready, just needs API details**

The foundation is solid - you just need the specific API details from Somnia documentation!

