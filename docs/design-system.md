# SynapseGov Design System & Plan Updates

## Design Inspiration Summary

### Primary Inspirations

1. **Tally.xyz Landing Page** - https://www.tally.xyz/
   - **Key Feature**: Animated/interactive dashboard element (NOT static)
   - 3D tilt effect with live governance preview
   - Engaging first impression
   - **Implementation**: Use Framer Motion for animations, CSS 3D transforms

2. **Snapshot Dark Mode** - https://snapshot.org/#/s:arbitrumfoundation.eth
   - **Key Feature**: Professional dark mode design
   - Dark grey/black backgrounds with white text
   - High contrast for readability
   - **Implementation**: Tailwind dark mode, dark-first approach

## Updated Technical Stack

**Frontend**:
- Framework: **Vite + React + TypeScript** (NOT Next.js)
- Styling: Tailwind CSS (Dark mode first)
- Animation: Framer Motion (for landing page interactive element)
- State Management: Zustand
- Wallet: Wagmi + Viem
- SDS SDK: @somnia-chain/streams

## Design System

### Colors (Dark Mode First)
- Background: `#0f0f0f`, `#1a1a1a`, `#262626`
- Text: `#ffffff`, `#a3a3a3`
- Primary: `#8b5cf6` (Purple - SynapseGov brand)
- Accent: `#06b6d4` (Cyan)
- Success: `#10b981` (Green)
- Error: `#ef4444` (Red)
- Warning: `#f59e0b` (Yellow)

### Logo & Branding
- Logo: Neural network nodes connected by lines (represents real-time connections)
- Colors: Purple (#8b5cf6) primary, Cyan (#06b6d4) accent
- Favicon: Simplified neural network icon
- Works in both dark and light modes

## Implementation Priorities

1. ✅ Dark mode as primary theme (Snapshot-inspired)
2. ✅ Interactive landing page element (Tally-inspired)
3. ✅ Real-time updates via SDS (unique differentiator)
4. ✅ Clean, professional UI (governance platform standards)
5. ✅ Mobile-first responsive design

## Plan Status

- ✅ Research phase complete
- ✅ Design inspiration documented
- ✅ Logo and favicon created
- ✅ Technical stack finalized (Vite, not Next.js)
- ✅ Design system defined
- ⏭️ Ready to proceed with implementation

