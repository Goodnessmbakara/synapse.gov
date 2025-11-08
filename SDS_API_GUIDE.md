# SDS SDK Integration - Complete Guide ✅

## ✅ SDK Status: READY TO USE!

The SDK (`@somnia-chain/streams` v0.1.1) is **installed and working**. Here's how to use it:

## SDK API Overview

Based on the TypeScript definitions, here are the key methods:

### Core Methods:

1. **`computeSchemaId(schema: string)`** - Computes schema ID from schema string
2. **`registerSchema(schema, parentSchemaId)`** - Registers a schema on-chain
3. **`publishData(schemaReference, dataId, data, registerSchema?)`** - Publishes data
4. **`emitEvents(events)`** - Emits events
5. **`registerEventSchemas(ids, schemas)`** - Registers event schemas
6. **`getAllPublisherDataForSchema(schemaId, publisher)`** - Queries published data

### Helper Classes:

- **`SchemaEncoder`** - Encodes/decodes schema data
- **`zeroBytes32`** - Utility constant

## Step-by-Step Integration

### Step 1: Initialize SDK ✅ (Already Done)

Your code in `frontend/src/lib/sds.ts` is correct:

```typescript
import { SDK } from '@somnia-chain/streams';

const sdk = new SDK({
  public: publicClient,  // From wagmi
  wallet: walletClient,  // Optional, for publishing
});
```

### Step 2: Register Schemas

Before using schemas, register them:

```typescript
// In sds.ts, update initializeSchemas:
export async function initializeSchemas(sdk: SDK) {
  // Register schemas
  const proposalSchemaId = await sdk.streams.registerSchema(
    ProposalSchemaString,
    zeroBytes32 // or parent schema ID
  );
  
  const voteSchemaId = await sdk.streams.registerSchema(
    VoteSchemaString,
    zeroBytes32
  );
  
  // ... etc
  
  return { proposalSchemaId, voteSchemaId, ... };
}
```

### Step 3: Use SchemaEncoder for Encoding

Update your encoding functions:

```typescript
import { SchemaEncoder } from '@somnia-chain/streams';

export function encodeProposal(proposal: Proposal): `0x${string}` {
  const encoder = new SchemaEncoder(ProposalSchemaString);
  return encoder.encodeData([
    { name: 'id', type: 'bytes32', value: proposal.id },
    { name: 'title', type: 'string', value: proposal.title },
    // ... etc
  ]);
}
```

### Step 4: Publish Data

Update `sds-publishers.ts`:

```typescript
// Uncomment and update:
await sdk.streams.publishData(
  proposalSchemaId, // Schema ID or schema string
  toHex(proposalId.toString(), { size: 32 }), // Data ID
  encodeProposal(proposal), // Encoded data
  false // Don't register schema (already registered)
);
```

### Step 5: Subscribe to Data

For subscriptions, you'll query published data:

```typescript
// In your hooks, query data:
const data = await sdk.streams.getAllPublisherDataForSchema(
  proposalSchemaId,
  contractAddress // Publisher address
);

// Decode the data:
const encoder = new SchemaEncoder(ProposalSchemaString);
const decoded = encoder.decodeData(data[0]);
```

### Step 6: Register Event Schemas

For event-based subscriptions:

```typescript
await sdk.streams.registerEventSchemas(
  ['ProposalCreated', 'VoteCast'], // Event IDs
  [
    {
      params: [
        { name: 'proposalId', paramType: 'uint256', isIndexed: true },
        { name: 'proposer', paramType: 'address', isIndexed: true },
        // ... etc
      ],
      eventTopic: '0x...' // Event topic hash
    },
    // ... more event schemas
  ]
);
```

## Updated Code Files

### 1. Update `frontend/src/lib/sds.ts`

```typescript
import { SDK, SchemaEncoder, zeroBytes32 } from '@somnia-chain/streams';

// Update initializeSchemas to register schemas:
export async function initializeSchemas(sdk: SDK) {
  // Register schemas first
  proposalSchemaId = await sdk.streams.registerSchema(
    ProposalSchemaString,
    zeroBytes32
  ) || null;
  
  voteSchemaId = await sdk.streams.registerSchema(
    VoteSchemaString,
    zeroBytes32
  ) || null;
  
  // ... etc
  
  return { proposalSchemaId, voteSchemaId, ... };
}

// Update encoding functions:
export function encodeProposal(proposal: Proposal): `0x${string}` {
  const encoder = new SchemaEncoder(ProposalSchemaString);
  return encoder.encodeData([
    { name: 'id', type: 'bytes32', value: proposal.id },
    { name: 'title', type: 'string', value: proposal.title },
    { name: 'description', type: 'string', value: proposal.description },
    // ... map all fields
  ]);
}
```

### 2. Update `frontend/src/lib/sds-publishers.ts`

Uncomment and update the publishing code:

```typescript
// Publish proposal:
await sdk.streams.publishData(
  proposalSchemaId!,
  toHex(proposalId.toString(), { size: 32 }),
  encodeProposal(proposal),
  false
);

// Publish vote:
await sdk.streams.publishData(
  voteSchemaId!,
  toHex(`${proposalId}-${voter}`, { size: 32 }),
  encodeVote(vote),
  false
);
```

### 3. Update Hooks for Querying

Instead of subscriptions, query published data:

```typescript
// In useProposals.ts:
useEffect(() => {
  const fetchProposals = async () => {
    if (!sdk || !proposalSchemaId) return;
    
    // Query all proposals from contract address
    const data = await sdk.streams.getAllPublisherDataForSchema(
      proposalSchemaId,
      GOVERNANCE_CONTRACT_ADDRESS
    );
    
    if (data) {
      const encoder = new SchemaEncoder(ProposalSchemaString);
      const proposals = data.map(d => {
        const decoded = encoder.decodeData(d);
        // Convert to Proposal type
        return decodedToProposal(decoded);
      });
      setProposals(proposals);
    }
  };
  
  fetchProposals();
  // Poll every few seconds for updates
  const interval = setInterval(fetchProposals, 5000);
  return () => clearInterval(interval);
}, [sdk, proposalSchemaId]);
```

## Testing Checklist

- [ ] SDK initializes correctly
- [ ] Schemas register successfully
- [ ] Data encoding works
- [ ] Data publishing works
- [ ] Data querying works
- [ ] Real-time updates (via polling or events)

## Important Notes

1. **Publishing requires wallet client** - You need `wallet` in SDK constructor
2. **Schema registration is one-time** - Register schemas once, reuse IDs
3. **Data IDs must be unique** - Use proposal IDs, vote IDs, etc.
4. **Querying is read-only** - Only needs public client

## Next Steps

1. **Update encoding functions** to use SchemaEncoder
2. **Register schemas** on first app load
3. **Uncomment publisher code** and test publishing
4. **Update hooks** to query published data
5. **Add polling** for real-time updates (or use events if available)

## Resources

- SDK: `@somnia-chain/streams@0.1.1`
- Types: `node_modules/@somnia-chain/streams/dist/index.d.ts`
- README: `node_modules/@somnia-chain/streams/README.md`

Your code structure is perfect - just needs these API updates! 🚀

