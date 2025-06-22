import React, { useState } from 'react';
import Icon from './Icon';
import Popup from './Popup';

const ICONS = [
  // Folders
  { id: 'evm-folder', image: '/assets/evmfolder.png', label: 'EVM NFTs', action: 'folder', folderId: 'evm-folder', row: 0, col: 3 },
  { id: 'sol-folder', image: '/assets/solfolder.png', label: 'SOL NFTs', action: 'folder', folderId: 'sol-folder', row: 1, col: 3 },
  // Row 1
  { id: 'wallet', image: '/assets/wallet.png', label: 'Wallet', action: 'wallet', row: 0, col: 0 },
  { id: 'mint', image: '/assets/mint.gif', label: 'Mint', action: 'mint', row: 0, col: 1 },
  { id: 'gallery', image: '/assets/lawbstarz.gif', label: 'NFT Gallery', action: 'nft-gallery', row: 0, col: 2 },
  // Row 2
  { id: 'purity', image: '/assets/purityfinance.png', label: 'Purity', action: 'popup', popupId: 'purity-popup', row: 1, col: 0 },
  // NFT icons for folders (not shown on desktop)
  { id: 'lawbstarz', image: '/assets/lawbstarz.gif', label: 'Lawbstarz', action: 'popup', popupId: 'lawbstarz-popup', row: -1, col: -1 },
  { id: 'lawbsters', image: '/assets/lawbsters.gif', label: 'Lawbsters', action: 'popup', popupId: 'lawbsters-popup', row: -1, col: -1 },
  { id: 'halloween', image: '/assets/lawbsterhalloween.gif', label: 'Halloween', action: 'popup', popupId: 'halloween-popup', row: -1, col: -1 },
  { id: 'lawbstation', image: '/assets/lawbstation.GIF', label: 'Lawbstation', action: 'popup', popupId: 'lawbstation-popup', row: -1, col: -1 },
  { id: 'nexus', image: '/assets/nexus.gif', label: 'Nexus', action: 'popup', popupId: 'nexus-popup', row: -1, col: -1 },
  // Row 4
  { id: 'chat', image: '/assets/miladychan.png', label: 'Chat', action: 'popup', popupId: 'chat-popup', row: 3, col: 0 },
  { id: 'lawb', image: '/assets/lawbticker.gif', label: '$LAWB', action: 'popup', popupId: 'lawb-popup', row: 3, col: 2 },
];

const ICON_WIDTH = 80;
const ICON_HEIGHT = 80;
const ICON_HGAP = 10;
const ICON_VGAP = 10;
const START_LEFT = 10;
const START_TOP = 10;

interface DesktopProps {
  onIconClick: (action: string, popupId?: string, url?: string) => void;
}

const Desktop: React.FC<DesktopProps> = ({ onIconClick }) => {
  // Only show desktop icons (row >= 0, col >= 0)
  const desktopIcons = ICONS.filter(icon => icon.row >= 0 && icon.col >= 0);
  // Recalculate positions for visible desktop icons, top-left oriented
  const getPositions = () => {
    const positions: Record<string, { x: number; y: number }> = {};
    let row = 0, col = 0;
    desktopIcons.forEach(icon => {
      positions[icon.id] = {
        x: START_LEFT + col * (ICON_WIDTH + ICON_HGAP),
        y: START_TOP + row * (ICON_HEIGHT + ICON_VGAP),
      };
      row++;
      if (row >= 4) { row = 0; col++; }
    });
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
      width: '100%',
      height: 'calc(100vh - 60px)',
      padding: '10px',
      zIndex: 10,
      overflow: 'visible'
    }}>
      {desktopIcons.map(icon => (
        <Icon
          key={icon.id}
          image={icon.image}
          label={icon.label}
          action={icon.action}
          popupId={icon.popupId}
          folderId={icon.folderId}
          position={positions[icon.id]}
          onDrag={(_e, data) => handleDrag(icon.id, data)}
          onClick={handleIconClick}
        />
      ))}
      {openFolders['evm-folder'] && (
        <Popup id="evm-folder" isOpen={true} onClose={() => setOpenFolders(prev => ({ ...prev, ['evm-folder']: false }))} onMinimize={() => setOpenFolders(prev => ({ ...prev, ['evm-folder']: false }))}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
            gap: 24,
            padding: 32,
            justifyItems: 'center',
            alignItems: 'center',
            minHeight: '100%',
          }}>
            {ICONS.filter(icon => ['lawbsters', 'lawbstarz', 'halloween', 'pixelawbs'].includes(icon.id)).map(icon => (
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
      {openFolders['sol-folder'] && (
        <Popup id="sol-folder" isOpen={true} onClose={() => setOpenFolders(prev => ({ ...prev, ['sol-folder']: false }))} onMinimize={() => setOpenFolders(prev => ({ ...prev, ['sol-folder']: false }))}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
            gap: 24,
            padding: 32,
            justifyItems: 'center',
            alignItems: 'center',
            minHeight: '100%',
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
    </div>
  );
};

export default Desktop;