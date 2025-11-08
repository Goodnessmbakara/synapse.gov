# SDS SDK Integration Guide

## ✅ Current Status

The SDS SDK (`@somnia-chain/streams`) is **already installed** (v0.1.1) and ready to use!

## Step-by-Step Integration

### Step 1: Verify SDK Installation ✅

The SDK is already installed. Verify with:
```bash
cd frontend
pnpm list @somnia-chain/streams
```

You should see: `@somnia-chain/streams 0.1.1`

### Step 2: Understand the SDK API

The SDK exports:
- `SDK` - Main SDK class
- `SchemaEncoder` - For encoding/decoding schema data
- `zeroBytes32` - Utility constant

### Step 3: Initialize SDK in Your App

The SDK initialization is already set up in `frontend/src/lib/sds.ts`. It needs:
- A `publicClient` (from wagmi/viem) - ✅ Already configured
- Optional `walletClient` (for publishing) - ✅ Already configured

### Step 4: Uncomment SDS Code

The code is mostly ready but has some commented sections. Here's what needs to be activated:

#### A. In `frontend/src/lib/sds.ts`:
- ✅ SDK import is active
- ✅ Schema definitions are active
- ✅ `initializeSDK()` function is active
- ⚠️ Some encoding functions use JSON (should use SchemaEncoder)

#### B. In `frontend/src/lib/sds-publishers.ts`:
- ⚠️ Most publishing code is commented out
- Need to uncomment when ready to publish events

#### C. In hooks (`frontend/src/hooks/`):
- ✅ Hooks are set up but return mock subscriptions if SDK not connected
- Will work automatically once SDK is initialized

### Step 5: Test SDK Connection

Create a test file to verify SDK works:

```typescript
// test-sds.ts
import { SDK } from '@somnia-chain/streams';
import { createPublicClient, http } from 'viem';

async function testSDK() {
  const publicClient = createPublicClient({
    transport: http('https://dream-rpc.somnia.network')
  });

  const sdk = new SDK({ public: publicClient });
  
  // Test schema ID computation
  const schemaString = 'bytes32 id, string title';
  const schemaId = await sdk.streams.computeSchemaId(schemaString);
  console.log('Schema ID:', schemaId);
  
  return sdk;
}
```

### Step 6: Enable Real-Time Features

Once SDK is verified working:

1. **Uncomment publisher code** in `sds-publishers.ts`
2. **Set up event listeners** on your contract
3. **Test subscriptions** in your React components

### Step 7: Register Event IDs

Before subscribing, you need to register event IDs with SDS. This typically requires:
- Calling `sdk.streams.registerEvent()` or similar
- Or using pre-registered event IDs

Check the official Somnia docs for the exact API.

## Current Implementation Status

### ✅ Already Working:
- SDK installed and importable
- Schema definitions defined
- Connection manager class created
- React hooks set up
- Error handling and fallbacks

### ⚠️ Needs Activation:
- Publisher code (commented out)
- Schema encoding (using JSON instead of SchemaEncoder)
- Event registration
- Actual subscription calls

### 🔍 To Investigate:
1. Exact API for `sdk.streams.subscribe()`
2. How to register event IDs
3. Schema encoding format
4. Publishing requirements (wallet client needed?)

## Next Steps

1. **Test SDK Connection**: Run a simple test to verify SDK works
2. **Check Official Docs**: Review Somnia Data Streams documentation
3. **Uncomment Code**: Gradually enable features as you verify them
4. **Test Subscriptions**: Start with read-only subscriptions
5. **Enable Publishing**: Once subscriptions work, enable publishing

## Resources

- SDK Package: `@somnia-chain/streams` v0.1.1
- Documentation: https://docs.somnia.network/somnia-data-streams/
- RPC URL: https://dream-rpc.somnia.network
- Explorer: https://explorer.somnia.network

## Troubleshooting

If SDK doesn't work:
1. Check RPC connection
2. Verify network configuration
3. Check SDK version compatibility
4. Review error messages in console
5. Check Somnia docs for API changes

