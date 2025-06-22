import React from 'react';
import Icon from './Icon';

interface DesktopProps {
  onIconClick: (action: string, popupId?: string, url?: string) => void;
}

const Desktop: React.FC<DesktopProps> = ({ onIconClick }) => {
  return (
    <div style={{ 
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 60px)',
      padding: '10px',
      zIndex: 1000,
      overflow: 'visible'
    }}>
      {/* Row 1 */}
      <div style={{ position: 'absolute', left: '10px', top: '10px', zIndex: 2000 }}>
        <Icon 
          image="/assets/wallet.png"
          label="Wallet" 
          action="wallet"
          top={0}
          left={0}
          onClick={onIconClick}
        />
        <Icon 
          image="/assets/mint.gif"
          label="Mint" 
          action="mint"
          top={0}
          left={90}
          onClick={onIconClick}
        />
        <Icon 
          image="/assets/lawbstarz.gif"
          label="NFT Gallery" 
          action="nft-gallery"
          top={0}
          left={180}
          onClick={onIconClick}
        />
      </div>

      {/* Row 2 */}
      <div style={{ position: 'absolute', left: '10px', top: '90px', zIndex: 2000 }}>
        <Icon 
          image="/assets/purityfinance.png"
          label="Purity" 
          action="popup"
          popupId="purity-popup"
          top={0}
          left={0}
          onClick={onIconClick}
        />
        <Icon 
          image="/assets/lawbstarz.gif"
          label="Lawbstarz" 
          action="popup"
          popupId="lawbstarz-popup"
          top={0}
          left={90}
          onClick={onIconClick}
        />
        <Icon 
          image="/assets/lawbstation.GIF"
          label="Lawbstation" 
          action="popup"
          popupId="lawbstation-popup"
          top={0}
          left={180}
          onClick={onIconClick}
        />
      </div>

      {/* Row 3 */}
      <div style={{ position: 'absolute', left: '10px', top: '170px', zIndex: 2000 }}>
        <Icon 
          image="/assets/lawbsters.gif"
          label="Lawbsters" 
          action="popup"
          popupId="lawbsters-popup"
          top={0}
          left={0}
          onClick={onIconClick}
        />
        <Icon 
          image="/assets/pixelawb.png"
          label="Pixelawbs" 
          action="popup"
          popupId="pixelawbs-popup"
          top={0}
          left={90}
          onClick={onIconClick}
        />
        <Icon 
          image="/assets/lawbsterhalloween.gif"
          label="Halloween" 
          action="popup"
          popupId="halloween-popup"
          top={0}
          left={180}
          onClick={onIconClick}
        />
      </div>

      {/* Row 4 */}
      <div style={{ position: 'absolute', left: '10px', top: '250px', zIndex: 2000 }}>
        <Icon 
          image="/assets/miladychan.png"
          label="Chat" 
          action="popup"
          popupId="chat-popup"
          top={0}
          left={0}
          onClick={onIconClick}
        />
        <Icon 
          image="/assets/nexus.gif"
          label="Nexus" 
          action="popup"
          popupId="nexus-popup"
          top={0}
          left={90}
          onClick={onIconClick}
        />
        <Icon 
          image="/assets/lawbticker.gif"
          label="$LAWB" 
          action="popup"
          popupId="lawb-popup"
          top={0}
          left={180}
          onClick={onIconClick}
        />
      </div>
    </div>
  );
};

export default Desktop;