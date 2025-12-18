# Chess Selection Page Analysis

## When This Page Appears

The "Select Chess Set" page appears in the Base Mini App when:

1. **User navigates to chess**: User clicks "Chess" icon from homepage → `/chess`
2. **User selects "VS AI" mode**: On the chess home page, user clicks "VS AI" button
3. **User clicks "Start Game"**: After selecting VS AI, user clicks "Start Game" button
4. **Piece selection page shows**: `setShowPieceSetSelector(true)` is called, which renders `renderPieceSetSelector()`

## Code Flow

**File**: `src/baseapp/BaseAppChessGame.tsx`

1. **State**: `const [showPieceSetSelector, setShowPieceSetSelector] = useState(false);` (line 414)
2. **Trigger**: When "Start Game" button is clicked (line 3423): `onClick={() => setShowPieceSetSelector(true)}`
3. **Render**: When `showPieceSetSelector` is true, `renderPieceSetSelector()` is called (line 3403)
4. **Location**: Rendered inside `<div className="center-area">` (line 3339)

## Current Issues

### 1. Missing Theme Toggle Visibility
- **Problem**: ThemeToggle is inside the mobile menu (line 3138), which requires clicking the hamburger menu button (☰) in the header
- **Expected**: ThemeToggle should be visible on every page
- **Current**: ThemeToggle is only accessible via Menu → ThemeToggle
- **Location**: Header has menu button at line 3012-3027, menu opens at line 3033-3159

### 2. "Back to Chess Home" Button Issue
- **Problem**: Uses `window.location.href = '/chess'` (line 1798) instead of proper navigation
- **Issue**: This causes a full page reload instead of using React Router
- **Should use**: `onBackToModeSelect()` prop or React Router navigation

### 3. Page Structure
The page shows:
- Header: "LAWB CHESS MAINNET BETA 3000" (always visible, line 2992)
- Menu button: Hamburger (☰) in header (line 3012-3027) - should be visible
- Content: Piece selection UI (line 1714-1818)
- ThemeToggle: Inside mobile menu (line 3138) - requires menu to be opened

## Recommendations

1. **Add ThemeToggle to piece selection page directly** - Make it visible without opening menu
2. **Fix "Back to Chess Home" navigation** - Use `onBackToModeSelect()` instead of `window.location.href`
3. **Ensure menu button is always visible** - Verify hamburger menu button shows on this page
4. **Add visual indicator** - Show that menu contains ThemeToggle option

## Testing Checklist

- [ ] Menu button (☰) is visible in header on piece selection page
- [ ] Menu opens when hamburger button is clicked
- [ ] ThemeToggle is visible in menu
- [ ] "Back to Chess Home" button works correctly
- [ ] Page renders correctly on mobile Base/Farcaster app
