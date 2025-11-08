# SynapseGov Smart Contracts

## Structure

```
contracts/
├── contracts/
│   └── Governance.sol
├── scripts/
│   ├── deploy.js
│   └── interact.js
├── test/
│   └── Governance.test.js
└── package.json
```

## Deployment

We use custom scripts with ethers.js for deployment instead of Hardhat.

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Fill in your private key and RPC URL
```

3. Compile contracts:
```bash
# Using solc directly or via foundry
forge build
```

4. Deploy:
```bash
pnpm run deploy
```

## Somnia Testnet Configuration

- Network: Somnia Testnet
- RPC: [To be configured]
- Chain ID: [To be configured]
- Explorer: [To be configured]

