# SynapseGov

**Real-Time DAO Governance Platform powered by Somnia Data Streams**

## Overview

SynapseGov is a real-time DAO governance platform that leverages Somnia Data Streams (SDS) to enable instant proposal appearance, live vote tracking, and real-time quorum visualization. Unlike traditional governance platforms that rely on polling, SynapseGov provides instant updates through SDS subscriptions.

## Features

- 🚀 **Real-Time Proposal Streaming**: New proposals appear instantly without page refresh
- 📊 **Live Vote Tracking**: Vote counts update in real-time as members vote
- ✅ **Instant Quorum Visualization**: See quorum progress update live
- 📱 **Live Activity Feed**: Stream of all governance actions
- 🔔 **Real-Time Notifications**: Instant alerts for important events
- 👥 **Delegate Tracking**: See how delegates vote in real-time

## Tech Stack

### Frontend
- **Vite** + **React** + **TypeScript**
- **Tailwind CSS** (Dark mode first)
- **Wagmi** + **Viem** (Wallet integration)
- **React Query** (Data fetching)
- **Zustand** (State management)
- **Framer Motion** (Animations)
- **Somnia Data Streams SDK** (Real-time data)

### Smart Contracts
- **Solidity** 0.8.20+
- **Custom deployment scripts** (ethers.js)
- **Somnia Testnet**

## Design Inspiration

- **Tally.xyz**: Interactive animated dashboard element on landing page
- **Snapshot**: Professional dark mode design
- **Somnia Data Streams**: Real-time capabilities

## Project Structure

```
synapsegov/
├── contracts/          # Smart contracts
│   ├── contracts/
│   │   └── Governance.sol
│   ├── scripts/
│   │   └── deploy.js
│   └── package.json
│
├── frontend/          # Vite + React frontend
│   ├── src/
│   │   ├── app/       # Page components
│   │   ├── components/# Reusable components
│   │   ├── hooks/     # Custom hooks (SDS subscriptions)
│   │   ├── lib/       # Utilities (SDS, contracts, wagmi)
│   │   └── types/     # TypeScript types
│   └── public/        # Static assets (logo, favicon)
│
└── docs/              # Documentation
```

## Getting Started

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Quick Start

1. **Install dependencies:**
```bash
# Contracts
cd contracts && pnpm install

# Frontend
cd frontend && pnpm install
```

2. **Configure environment:**
```bash
# Copy .env.example files and fill in values
```

3. **Deploy contracts:**
```bash
cd contracts
# Compile contract first, then:
node scripts/deploy.js
```

4. **Start frontend:**
```bash
cd frontend
pnpm dev
```

## SDS Integration

SynapseGov uses Somnia Data Streams for real-time updates:

- **Publishers**: Contract events → SDS streams (server-side)
- **Subscribers**: SDS streams → React components (client-side)
- **Schemas**: ProposalSchema, VoteSchema, QuorumEventSchema, ActivityEventSchema

See `frontend/src/lib/sds.ts` and `frontend/src/lib/sds-publishers.ts` for implementation details.

## Key Components

- **ProposalCard**: Displays proposal with real-time vote counts
- **VoteButton**: Cast votes with instant feedback
- **QuorumIndicator**: Visual quorum progress with real-time updates
- **ActivityFeed**: Live stream of governance actions
- **NotificationCenter**: Real-time notifications
- **Interactive Landing**: Animated dashboard preview (Tally-inspired)

## Development

### Contracts
- Edit `contracts/contracts/Governance.sol`
- Deploy with `contracts/scripts/deploy.js`
- No Hardhat - using custom scripts

### Frontend
- Pages: `frontend/src/app/`
- Components: `frontend/src/components/`
- SDS Hooks: `frontend/src/hooks/`
- Run: `pnpm dev` (starts on port 3000)

## Demo Strategy

1. Show landing page with interactive element
2. Create proposal → **INSTANT APPEARANCE** (via SDS)
3. Cast votes → **INSTANT UPDATES** (all users see simultaneously)
4. Show quorum progress → **LIVE UPDATES**
5. Activity feed → **REAL-TIME STREAM**

## Documentation

- [PRD](./PRD_SynapseGov.md) - Complete product requirements
- [Design System](./docs/design-system.md) - Design guidelines
- [Setup Guide](./SETUP.md) - Setup instructions
- [Research](./research-inspiration.md) - Design inspiration

## License

MIT

## Hackathon Submission

- **Project**: SynapseGov
- **Hackathon**: Somnia Data Streams Mini Hackathon
- **Dates**: November 4-15, 2025
- **Platform**: Somnia Testnet
