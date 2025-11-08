# SynapseGov Frontend

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Fill in your configuration
```

3. Start development server:
```bash
pnpm dev
```

## Tech Stack

- **Vite** - Build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling (Dark mode first)
- **Wagmi + Viem** - Wallet integration
- **React Query** - Data fetching
- **Zustand** - State management
- **Framer Motion** - Animations
- **React Router** - Routing
- **Somnia Data Streams SDK** - Real-time data

## Project Structure

```
src/
├── app/              # Page components
├── components/       # Reusable components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and configs
├── types/           # TypeScript types
└── main.tsx         # Entry point
```

