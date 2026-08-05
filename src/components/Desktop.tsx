import React, { useState } from 'react';
import Icon from './Icon';
import Popup from './Popup';
import MintPopup from './MintPopup';
import NFTGallery from './NFTGallery';
import MemeGenerator from './MemeGenerator';
import MediaGallery from './MediaGallery';
import NFTDetailPopup from './NFTDetailPopup';

interface DesktopIcon {
  id: string;
  image: string;
  label: string;
  action: string;
  url?: string;
  popupId?: string;
  folderId?: string;
  row: number;
  col: number;
}

const ICONS: DesktopIcon[] = [
  // Folders
  { id: 'evm-folder', image: '/assets/evmfolder.png', label: 'EVM NFTs', action: 'folder', folderId: 'evm-folder', row: 0, col: 3 },
  { id: 'sol-folder', image: '/assets/solfolder.png', label: 'SOL NFTs', action: 'folder', folderId: 'sol-folder', row: 1, col: 3 },
  { id: 'remilia-folder', image: '/assets/remilia-folder.webp', label: 'Remilia', action: 'folder', folderId: 'remilia-folder', row: 2, col: 3 },
  // Row 1
  { id: 'mint', image: '/assets/mint.webp', label: 'Mint', action: 'mint', row: 0, col: 0 },
  { id: 'gallery', image: '/assets/lawbstarz.webp', label: 'LAWB Gallery', action: 'nft-gallery', row: 0, col: 2 },
  { id: 'meme-generator', image: '/assets/meme.webp', label: 'Meme Generator', action: 'meme-generator', row: 0, col: 4 },

  // Row 2
  { id: 'purity', image: '/assets/purityfinance.png', label: 'Purity', action: 'popup', popupId: 'purity-popup', row: 1, col: 0 },
  { id: 'lawbshop', image: '/assets/lawbshop.png', label: 'Lawb.Shop', action: 'url', url: 'https://store.fun/lawbshop', row: 1, col: 1 },
  // NFT icons for folders (not shown on desktop)
  { id: 'lawbstarz', image: '/assets/lawbstarz.webp', label: 'Lawbstarz', action: 'popup', popupId: 'lawbstarz-popup', row: -1, col: -1 },
  { id: 'lawbsters', image: '/assets/lawbsters.gif', label: 'Lawbsters', action: 'popup', popupId: 'lawbsters-popup', row: -1, col: -1 },
  { id: 'halloween', image: '/assets/lawbsterhalloween.webp', label: 'Halloween', action: 'popup', popupId: 'halloween-popup', row: -1, col: -1 },
  { id: 'pixelawbs', image: '/assets/pixelawb.png', label: 'Pixelawbs', action: 'popup', popupId: 'pixelawbs-popup', row: -1, col: -1 },
  { id: 'asciilawbs', image: '/assets/asciilawb.GIF', label: 'ASCII Lawbsters', action: 'popup', popupId: 'asciilawbs-popup', row: -1, col: -1 },
  { id: 'red-vs-blue', image: '/images/racing-flag.svg', label: 'Red VS Blue', action: 'url', url: 'https://opensea.io/item/ethereum/0x46353e0b6b4d9723d253c00acd29adefc05083bb/2', row: -1, col: -1 },
  { id: 'lawbstation', image: '/assets/lawbstation.webp', label: 'Lawbstation', action: 'popup', popupId: 'lawbstation-popup', row: -1, col: -1 },
  { id: 'nexus', image: '/assets/nexus.webp', label: 'Nexus', action: 'popup', popupId: 'nexus-popup', row: -1, col: -1 },
  // Remilia folder contents (not shown on desktop)
  { id: 'chat', image: '/assets/miladychan.png', label: 'Miladychan', action: 'popup', popupId: 'miladychan-popup', row: -1, col: -1 },
  { id: 'remilia-net', image: '/assets/remilia-net-icon.png', label: 'Remilia.net', action: 'url', url: 'https://remilia.net', row: -1, col: -1 },
  { id: 'remilia-wiki', image: '/assets/remilia-wiki-icon.png', label: 'Remilia Wiki', action: 'url', url: 'https://wiki.remilia.org', row: -1, col: -1 },
  { id: 'network-spirits', image: '/assets/networkspirits-icon.png', label: 'Network Spirits', action: 'url', url: 'https://networkspirits.net', row: -1, col: -1 },
  { id: 'radbro', image: '/assets/radbro-icon.png', label: 'Radbro', action: 'url', url: 'https://radbro.xyz', row: -1, col: -1 },
  { id: 'nonon', image: '/assets/nonon-icon.png', label: 'NONON', action: 'url', url: 'https://nonon.house', row: -1, col: -1 },
  { id: 'vrmilady', image: '/assets/vrmilady-icon.png', label: 'VRMilady', action: 'url', url: 'https://vrmilady.net', row: -1, col: -1 },
  // Row 4
  { id: 'lawb', image: '/assets/lawbticker.webp', label: 'tokens', action: 'popup', popupId: 'lawb-popup', row: 3, col: 2 },
  { id: 'reef-arcade', image: '/assets/reef-arcade.svg', label: 'Reef Run', action: 'arcade', row: 2, col: 0 },
  { id: 'lawb-chess', image: '/assets/chess.svg', label: 'Lawb Chess', action: 'chess', row: 2, col: 1 },
  { id: 'lawb-profile', image: '/assets/wallet.png', label: 'Lawb Profile', action: 'lawb-profile', row: 2, col: 2 },
  { id: 'lawb-leaderboard', image: '/images/sticker3.png', label: 'Leaderboard', action: 'lawb-leaderboard', row: 2, col: 4 },
];

// Icon sizing
const ICON_WIDTH = 80;
const ICON_HEIGHT = 80;
const ICON_HGAP = 10;
const ICON_VGAP = 4;
const START_LEFT = 10;
const START_TOP = 10;

interface DesktopProps {
  onIconClick: (action: string, popupId?: string, url?: string) => void;
}

const Desktop: React.FC<DesktopProps> = ({ onIconClick }) => {
  // Only show desktop icons (row >= 0, col >= 0)
  const desktopIcons = ICONS.filter(icon => icon.row >= 0 && icon.col >= 0);
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  // Detect dark mode
  const isDarkMode = typeof document !== 'undefined' && 
    (document.body.classList.contains('lawb-app-dark-mode') || 
     document.documentElement.classList.contains('lawb-app-dark-mode'));
  
  // Recalculate positions for visible desktop icons, top-left oriented
  const getPositions = () => {
    const positions: Record<string, { x: number; y: number }> = {};
    
    if (isMobile) {
      // Mobile: Use 2-column grid that fits screen
      let index = 0;
      desktopIcons.forEach(icon => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        positions[icon.id] = {
          x: START_LEFT + col * (ICON_WIDTH + ICON_HGAP),
          y: START_TOP + row * (ICON_HEIGHT + ICON_VGAP),
        };
        index++;
      });
    } else {
      // Desktop: Original column-based layout
      let row = 0, col = 0;
      desktopIcons.forEach(icon => {
        positions[icon.id] = {
          x: START_LEFT + col * (ICON_WIDTH + ICON_HGAP),
          y: START_TOP + row * (ICON_HEIGHT + ICON_VGAP),
        };
        row++;
        if (row >= 3) { row = 0; col++; }
      });
    }
    return positions;
  };
  const [positions, setPositions] = useState(getPositions());
  const [openFolders, setOpenFolders] = useState<{ [key: string]: boolean }>({});

  const handleDrag = (id: string, data: { x: number; y: number }) => {
    setPositions(prev => ({ ...prev, [id]: { x: data.x, y: data.y } }));
  };

  const handleIconClick = (action: string, popupId?: string, url?: string, folderId?: string) => {
    if (action === 'folder' && folderId) {
      setOpenFolders(prev => ({ ...prev, [folderId]: true }));
      return;
    }
    // For all other actions, call parent handler
    onIconClick(action, popupId, url);
  };

  return (
    <div style={{ 
      position: 'relative',
      zIndex: 1,
      width: '100vw',
      height: '100vh',
      background: 'transparent',
      overflow: 'hidden',
    }}>
      <div style={{ 
        position: 'relative',
        width: '100%',
        maxWidth: '100vw',
        height: 'calc(100vh - 60px)',
        padding: isMobile ? '8px' : '10px',
        zIndex: 10,
        overflow: isMobile ? 'hidden' : 'visible',
        boxSizing: 'border-box'
      }}>
        {desktopIcons.map(icon => (
          <Icon
            key={icon.id}
            image={icon.image}
            label={icon.label}
            action={icon.action}
            url={icon.url}
            popupId={icon.popupId}
            folderId={icon.folderId}
            position={positions[icon.id]}
            onDrag={(_e, data) => handleDrag(icon.id, data)}
            onClick={handleIconClick}
          />
        ))}
        {openFolders['evm-folder'] && (
          <Popup 
            id="evm-folder" 
            isOpen={true} 
            onClose={() => setOpenFolders(prev => ({ ...prev, ['evm-folder']: false }))} 
            onMinimize={() => setOpenFolders(prev => ({ ...prev, ['evm-folder']: false }))} 
            zIndex={3001}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(96px, 1fr))',
              gap: isMobile ? '16px' : '24px',
              padding: isMobile ? '16px' : '32px',
              justifyItems: 'center',
              alignItems: 'center',
              minHeight: '100%',
              width: '100%',
              height: '100%',
              overflow: 'auto',
              boxSizing: 'border-box',
            }}>
              {ICONS.filter(icon => ['lawbsters', 'lawbstarz', 'halloween', 'pixelawbs', 'asciilawbs', 'red-vs-blue'].includes(icon.id)).map(icon => (
                <Icon
                  key={icon.id}
                  image={icon.image}
                  label={icon.label}
                  action={icon.action}
                  url={icon.url}
                  popupId={icon.popupId}
                  folderId={icon.folderId}
                  onClick={handleIconClick}
                  isInFolder={true}
                />
              ))}
            </div>
          </Popup>
        )}
        {openFolders['sol-folder'] && (
          <Popup 
            id="sol-folder" 
            isOpen={true} 
            onClose={() => setOpenFolders(prev => ({ ...prev, ['sol-folder']: false }))} 
            onMinimize={() => setOpenFolders(prev => ({ ...prev, ['sol-folder']: false }))} 
            zIndex={3001}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(96px, 1fr))',
              gap: isMobile ? '16px' : '24px',
              padding: isMobile ? '16px' : '32px',
              justifyItems: 'center',
              alignItems: 'center',
              minHeight: '100%',
              width: '100%',
              height: '100%',
              overflow: 'auto',
              boxSizing: 'border-box',
            }}>
              {ICONS.filter(icon => ['lawbstation', 'nexus'].includes(icon.id)).map(icon => (
                <Icon
                  key={icon.id}
                  image={icon.image}
                  label={icon.label}
                  action={icon.action}
                  popupId={icon.popupId}
                  folderId={icon.folderId}
                  onClick={handleIconClick}
                  isInFolder={true}
                />
              ))}
            </div>
          </Popup>
        )}
        {openFolders['remilia-folder'] && (
          <Popup
            id="remilia-folder"
            title="Remilia"
            isOpen={true}
            onClose={() => setOpenFolders(prev => ({ ...prev, ['remilia-folder']: false }))}
            onMinimize={() => setOpenFolders(prev => ({ ...prev, ['remilia-folder']: false }))}
            zIndex={3001}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(96px, 1fr))',
              gap: isMobile ? '16px' : '24px',
              padding: isMobile ? '16px' : '32px',
              justifyItems: 'center',
              alignItems: 'center',
              minHeight: '100%',
              width: '100%',
              height: '100%',
              overflow: 'auto',
              boxSizing: 'border-box',
            }}>
              {ICONS.filter(icon => ['chat', 'remilia-net', 'remilia-wiki', 'network-spirits', 'radbro', 'nonon', 'vrmilady'].includes(icon.id)).map(icon => (
                <Icon
                  key={icon.id}
                  image={icon.image}
                  label={icon.label}
                  action={icon.action}
                  url={icon.url}
                  popupId={icon.popupId}
                  folderId={icon.folderId}
                  onClick={handleIconClick}
                  isInFolder={true}
                />
              ))}
            </div>
          </Popup>
        )}
      </div>
    </div>
  );
};

export default Desktop;