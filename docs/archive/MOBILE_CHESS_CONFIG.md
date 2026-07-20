# Mobile Chess Configuration Documentation

## Overview

This document describes the mobile configuration for the chess game at `lawb.xyz/chess`. The chess page supports both single-player (AI) and multiplayer modes, with responsive mobile layouts optimized for touch devices.

## Mobile Detection

### Detection Method
- **Hook**: `useMediaQuery('(max-width: 768px)')` from `src/hooks/useMediaQuery.ts`
- **Breakpoint**: 768px width
- **Applied in**: 
  - `src/main.tsx` - Routes to `Mobile.tsx` for main site
  - `src/components/ChessPage.tsx` - Applies mobile classes and passes `isMobile` prop

### Mobile Detection Hook
Located in `src/hooks/useMediaQuery.ts`:
- Uses `window.matchMedia()` for responsive detection
- Updates on window resize
- Returns boolean indicating if query matches

## File Structure

### Main Chess Page Container
**File**: `src/components/ChessPage.tsx`
- **Purpose**: Wrapper component that routes between single-player and multiplayer modes
- **Mobile Behavior**:
  - Applies `mobile` or `desktop` class to container
  - Hides chat window on mobile (chat available in sidebar popup instead)
  - Passes `isMobile` prop to child components
- **State Management**:
  - `gameMode`: 'singleplayer' | 'multiplayer'
  - `isChatVisible`: Hidden by default on mobile (`!isMobile`)

**Styles**: `src/components/ChessPage.css`
- Mobile viewport optimizations (lines 14-82)
- Uses `100dvh` (dynamic viewport height) for mobile browsers
- Scroll handling with `-webkit-overflow-scrolling: touch`
- Landscape orientation support

### Single Player Chess
**Component**: `src/components/ChessGame.tsx`
- **Purpose**: AI chess game (single player mode)
- **Props**: Receives `isMobile` prop from `ChessPage.tsx`
- **Mobile Features**:
  - Touch-optimized piece selection
  - Responsive chessboard sizing
  - Mobile-friendly sidebar with tabs
  - Larger touch targets (44px minimum)

**Styles**: `src/components/ChessGame.css`
- Mobile styles start at line 2644
- Key mobile features:
  - Flex-direction column layout
  - Chessboard: max-width 90vw, max-height 60vh
  - Sidebars: Full width, max-height 30vh, positioned below board
  - Touch targets: 50px minimum for squares, 44px for buttons
  - `touch-action: manipulation` for better touch response

### Multiplayer Chess
**Component**: `src/components/ChessMultiplayer.tsx`
- **Purpose**: Online multiplayer chess game
- **Props**: Receives `isMobile` prop from `ChessPage.tsx`
- **Mobile Features**:
  - Real-time game synchronization via Firebase
  - Mobile-optimized lobby and game views
  - Touch-friendly controls
  - Responsive board layout

**Styles**: `src/components/ChessMultiplayer.css`
- Mobile styles start at line 2224
- Key mobile features:
  - Similar layout to single-player (column flex-direction)
  - Chessboard: `calc(100vw - 24px)` width/height, 1:1 aspect ratio
  - Sidebars: Full width, max-height 30vh
  - Touch optimizations: `touch-action: manipulation`
  - Larger buttons: 44px minimum height/width

## Mobile-Specific Features

### Layout Changes
1. **Chessboard Positioning**: 
   - Desktop: Centered with sidebars on sides
   - Mobile: Full width at top, sidebars below

2. **Sidebar Behavior**:
   - Desktop: Always visible sidebars
   - Mobile: Collapsible sidebars with tabs (leaderboard, moves, gallery, chat)

3. **Chat Integration**:
   - Desktop: Independent draggable/resizable chat window
   - Mobile: Chat integrated into sidebar popup, hidden by default

### Touch Optimizations
- **Touch Targets**: Minimum 44px × 44px (Apple HIG recommendation)
- **Touch Action**: `touch-action: manipulation` prevents double-tap zoom
- **Square Size**: Minimum 50px for chess squares
- **Button Size**: Minimum 44px for all interactive elements
- **Touch Feedback**: Active states with scale transforms

### Viewport Handling
- Uses `100dvh` (dynamic viewport height) instead of `100vh` for mobile browsers
- Handles address bar show/hide on mobile browsers
- Landscape orientation support with adjusted layouts

### Responsive Breakpoints
- **Mobile**: `max-width: 768px`
- **Small Mobile**: `max-width: 480px`
- **Very Small**: `max-width: 360px`

## Component Props Flow

```
ChessPage.tsx (detects mobile)
  ├─ isMobile: boolean (from useMediaQuery)
  ├─ ChessGame.tsx (single player)
  │   └─ isMobile prop → applies mobile classes/styles
  └─ ChessMultiplayer.tsx (multiplayer)
      └─ isMobile prop → applies mobile classes/styles
```

## CSS Class Structure

### Mobile Classes
- `.chess-page.mobile` - Main container mobile class
- `.chess-game.mobile` - Single player mobile class
- `.chess-game.mobile-device` - Device-specific mobile class
- `.mobile-device` - General mobile device class

### Media Queries
All mobile styles use `@media (max-width: 768px)` for consistency.

## Testing Mobile Configuration

To test mobile configuration:
1. Use browser DevTools responsive mode (768px or less)
2. Test on actual mobile devices
3. Test both portrait and landscape orientations
4. Verify touch interactions work correctly
5. Check chat visibility and sidebar behavior

## Key Files Summary

| File | Purpose | Mobile Relevance |
|------|---------|------------------|
| `src/components/ChessPage.tsx` | Main container/router | Mobile detection, layout control |
| `src/components/ChessPage.css` | Container styles | Mobile viewport, scroll handling |
| `src/components/ChessGame.tsx` | Single player component | Mobile touch handling, layout |
| `src/components/ChessGame.css` | Single player styles | Mobile responsive styles (2644+) |
| `src/components/ChessMultiplayer.tsx` | Multiplayer component | Mobile real-time sync, layout |
| `src/components/ChessMultiplayer.css` | Multiplayer styles | Mobile responsive styles (2224+) |
| `src/hooks/useMediaQuery.ts` | Mobile detection hook | Core mobile detection logic |

## Notes

- Mobile configuration is consistent across both single-player and multiplayer modes
- Chat is intentionally hidden by default on mobile to maximize board space
- All touch interactions are optimized for mobile devices
- The chessboard maintains 1:1 aspect ratio on mobile for optimal viewing

