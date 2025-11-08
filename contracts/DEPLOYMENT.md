# Smart Contract Deployment Guide

## Prerequisites

1. **Install Foundry** (if not already installed):
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Verify Foundry installation**:
   ```bash
   forge --version
   ```

## Deployment Steps

### 1. Set Up Environment Variables

```bash
cd contracts
cp env.example .env
```

Edit `.env` and add your private key:
```env
PRIVATE_KEY=your_private_key_without_0x_prefix
RPC_URL=https://dream-rpc.somnia.network
EXPLORER_URL=https://explorer.somnia.network
QUORUM_THRESHOLD=50
VOTING_PERIOD=604800
```

⚠️ **Security Note**: Never commit your `.env` file. It contains your private key!

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Compile Contract

```bash
pnpm run compile
# or
forge build
```

This will create artifacts in the `out/` directory.

### 4. Deploy Contract

```bash
pnpm run deploy
# or
node scripts/deploy.js
```

The script will:
- Check your wallet balance
- Load compiled contract artifacts
- Deploy to Somnia Testnet
- Save deployment info to `deployment.json`
- Display the contract address

### 5. Update Frontend Configuration

After deployment, copy the contract address and update `frontend/.env`:

```bash
cd ../frontend
cp env.example .env
```

Edit `.env`:
```env
VITE_CONTRACT_ADDRESS=<deployed_contract_address>
VITE_RPC_URL=https://dream-rpc.somnia.network
VITE_EXPLORER_URL=https://explorer.somnia.network
```

## Troubleshooting

### Error: "Contract artifact not found"
- Make sure you've compiled the contract: `forge build`
- Check that `out/Governance.sol/Governance.json` exists

### Error: "PRIVATE_KEY not set"
- Make sure you've created `.env` file from `env.example`
- Verify your private key is set correctly (without 0x prefix)

### Error: "Insufficient funds"
- You need testnet tokens (SOM) in your wallet
- Get testnet tokens from Somnia faucet (if available)

### Error: "Network connection failed"
- Check your RPC URL: `https://dream-rpc.somnia.network`
- Verify network connectivity
- Check if Somnia Testnet is operational

## Verification

After deployment, verify your contract:

1. **Check deployment.json**: Contains all deployment details
2. **View on Explorer**: Visit the explorer URL shown in deployment output
3. **Test Interaction**: Use the frontend or interact script to test

## Next Steps

1. ✅ Contract deployed
2. ⏭️ Update frontend `.env` with contract address
3. ⏭️ Test proposal creation
4. ⏭️ Test voting functionality
5. ⏭️ Verify SDS integration

