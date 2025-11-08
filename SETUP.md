# SynapseGov - Setup Instructions

## Prerequisites

- Node.js 18+
- pnpm (package manager)
- Git

## Quick Start

### 1. Install Dependencies

**Contracts:**
```bash
cd contracts
pnpm install
```

**Frontend:**
```bash
cd frontend
pnpm install
```

### 2. Configure Environment Variables

**Contracts (.env):**
```bash
cd contracts
cp .env.example .env
# Edit .env with your private key and RPC URL
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
# Edit .env with contract address after deployment
```

### 3. Compile Contracts

You'll need to compile the Solidity contract. Options:
- Use `solc` directly
- Use Foundry (`forge build`)
- Use Remix IDE

### 4. Deploy Contracts

```bash
cd contracts
# Update deploy.js with compiled contract ABI and bytecode
node scripts/deploy.js
```

Copy the deployed contract address to `frontend/.env`

### 5. Start Frontend

```bash
cd frontend
pnpm dev
```

Visit http://localhost:3000

## Development

### Contracts
- Edit contracts in `contracts/contracts/`
- Deploy scripts in `contracts/scripts/`
- Tests in `contracts/test/` (to be created)

### Frontend
- Pages in `frontend/src/app/`
- Components in `frontend/src/components/`
- Hooks in `frontend/src/hooks/`
- Utilities in `frontend/src/lib/`

## SDS Integration

1. Set up SDS SDK connection
2. Initialize schemas
3. Set up publishers (server-side or API route)
4. Set up subscribers (client-side hooks)

See `frontend/src/lib/sds.ts` and `frontend/src/lib/sds-publishers.ts` for implementation.

## Troubleshooting

- **Wallet connection issues**: Ensure Somnia Testnet is configured correctly
- **SDS connection issues**: Check RPC URL and network configuration
- **Contract errors**: Verify contract is deployed and address is correct

