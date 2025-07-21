import React, { useState, useEffect, useRef } from 'react';
import { Tweet } from 'react-tweet';
import Desktop from './components/Desktop';
import Taskbar from './components/Taskbar';
import Popup from './components/Popup';
import MintPopup from './components/MintPopup';
import NFTGallery from './components/NFTGallery';
import MemeGenerator from './components/MemeGenerator';


import { createUseStyles } from 'react-jss';
import { useAppKit } from '@reown/appkit/react';
import { useNavigate } from 'react-router-dom';

const useStyles = createUseStyles({
  body: {
    margin: 0,
    height: '100vh',
    width: '100vw',
    fontFamily: "'MS Sans Serif', Arial, sans-serif",
    color: '#000',
    cursor: 'url("/assets/lawbpointer.png"), auto',
    // overflow: 'hidden', // Removed to allow modals to be clickable
  }
});

function App() {
  const classes = useStyles();
  const { open } = useAppKit();
  const [address, setAddress] = useState<string | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [activePopup, setActivePopup] = useState<string | null>('pixelawbs-popup');
  const [minimizedPopups, setMinimizedPopups] = useState<Set<string>>(new Set());
  const [showMintPopup, setShowMintPopup] = useState(false);
  const [showNFTGallery, setShowNFTGallery] = useState(false);
  const [showMemeGenerator, setShowMemeGenerator] = useState(false);


  const [showChessLoading, setShowChessLoading] = useState(false);
  const navigate = useNavigate();

  // TikTok embed ref
  const tiktokRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activePopup === 'halloween-popup' && tiktokRef.current) {
      // Remove any previous script
      const prev = tiktokRef.current.querySelector('script[data-tiktok-embed]');
      if (prev) prev.remove();
      // Inject TikTok script
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      script.setAttribute('data-tiktok-embed', 'true');
      tiktokRef.current.appendChild(script);
    }
  }, [activePopup]);

  const handleIconClick = (action: string, popupId?: string, url?: string) => {
    if (action === 'url' && url) {
      window.open(url, '_blank');
    } else if (action === 'popup' && popupId) {
      setActivePopup(popupId);
      setMinimizedPopups(prev => {
        const newSet = new Set(prev);
        newSet.delete(popupId);
        return newSet;
      });
      void document.body.offsetWidth;
    } else if (action === 'wallet') {
      if (!isConnected) {
        void open();
      } else {
        setIsConnected(false);
        setAddress(undefined);
      }
    } else if (action === 'mint') {
      if (!address) {
        alert('Please connect your wallet first!');
        return;
      }
      setShowMintPopup(true);
    } else if (action === 'nft-gallery') {
      setShowNFTGallery(true);
    } else if (action === 'meme-generator') {
      setShowMemeGenerator(true);

    } else if (action === 'chess') {
      if (!isConnected) {
        void open().then(() => {
          // Wait for connection, then navigate
          const checkConnection = () => {
            if (window.ethereum && window.ethereum.selectedAddress) {
              setShowChessLoading(true);
            } else {
              setTimeout(checkConnection, 200);
            }
          };
          checkConnection();
        });
      } else {
        setShowChessLoading(true);
      }
    }
  };

  const closePopup = () => setActivePopup(null);
  
  const minimizePopup = (popupId: string) => {
    setMinimizedPopups(prev => new Set(prev).add(popupId));
    setActivePopup(null);
  };

  const restorePopup = (popupId: string) => {
    if (popupId === 'mint-popup') {
      setShowMintPopup(true);
    } else if (popupId === 'nft-gallery-popup') {
      setShowNFTGallery(true);
    } else if (popupId === 'meme-generator-popup') {
      setShowMemeGenerator(true);

    } else {
      setActivePopup(popupId);
    }
    setMinimizedPopups(prev => {
      const newSet = new Set(prev);
      newSet.delete(popupId);
      return newSet;
    });
  };

  const closeMintPopup = () => setShowMintPopup(false);
  const closeNFTGallery = () => setShowNFTGallery(false);
  const closeMemeGenerator = () => setShowMemeGenerator(false);

  const minimizeMintPopup = () => {
    setShowMintPopup(false);
    setMinimizedPopups(prev => new Set(prev).add('mint-popup'));
  };

  const minimizeNFTGallery = () => {
    setShowNFTGallery(false);
    setMinimizedPopups(prev => new Set(prev).add('nft-gallery-popup'));
  };

  const minimizeMemeGenerator = () => {
    setShowMemeGenerator(false);
    setMinimizedPopups(prev => new Set(prev).add('meme-generator-popup'));
  };



  const walletButton = (
    <div 
      onClick={() => {
        if (!isConnected) {
          void open();
        } else {
          setIsConnected(false);
        setAddress(undefined);
        }
      }} 
      style={{ 
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        color: isConnected ? 'limegreen' : 'red',
        fontWeight: 'bold'
      }}
    >
      <span style={{
        height: '10px',
        width: '10px',
        borderRadius: '50%',
        backgroundColor: isConnected ? 'limegreen' : 'red',
        marginRight: '8px',
        border: '1px solid black'
      }}></span>
              {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Disconnected'}
    </div>
  );

  return (
    <div className={classes.body}>
      {showChessLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <video 
            src="/images/loadingchess.mp4" 
            style={{ width: 120, height: 120, marginBottom: 32 }}
            autoPlay
            muted
            onEnded={() => {
              setShowChessLoading(false);
              navigate('/chess');
            }}
          />
          <div style={{ color: '#fff', fontSize: 28, fontFamily: 'monospace', letterSpacing: 2 }}>LOADING LAWB CHESS...</div>
        </div>
      )}
      <Desktop onIconClick={handleIconClick} />

      <Taskbar
        minimizedWindows={Array.from(minimizedPopups)}
        onRestoreWindow={restorePopup}
        walletButton={walletButton}
        connectionStatus={{
          connected: isConnected,
          address: address,
          ens: undefined
        }}
      />

      <Popup id="chat-popup" isOpen={activePopup === 'chat-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        <p style={{marginBottom: '10px'}}>
          join the chat, there is no meme we lawb you <a href="https://boards.miladychan.org/milady/33793" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>/milady/33793</a>
        </p>
        <img src="/assets/miladychanfaq.png" alt="Milady Chan FAQ" style={{ maxWidth: '100%', marginTop: '10px' }} />
      </Popup>

      <Popup id="purity-popup" isOpen={activePopup === 'purity-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        <p style={{marginBottom: '10px'}}>
          purify your wallet and cleanse your soul with Purity Finance.
        </p>
        <p style={{marginBottom: '10px'}}>
          swap any sol token in your wallet directly for $LAWB
        </p>
        <a href="https://www.purity.finance/lawb" target="_blank" rel="noopener noreferrer" style={{cursor: 'pointer'}}>click to Purify</a>
        <img src="/assets/puritylawb.png" alt="Purity Lawb" style={{ maxWidth: '100%', marginTop: '10px' }} />
      </Popup>

      <Popup id="lawbstarz-popup" isOpen={activePopup === 'lawbstarz-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        <p style={{marginBottom: '10px'}}>
          ☆ LAWBSTARZ 666x LOBSTERS DRIPPED IN BUTTER ☆ 666x PREMIUM PFP COLLECTION ☆ LAWBSTARZ IS A MUSIC NFT ☆ LAWBSTARZ IS AN <a href="https://allstarz.world" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>ALLSTARZ</a> DERIVATIVE ☆ LAWBSTARZ IS INSPIRED BY <a href="https://www.remilia.org/" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>REMILIA CORP</a> ☆ LED BY NETWORK SPIRITUALITY ☆ 666 <a href="https://www.cigawrettepacks.shop/" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>CIGAWRETTEPACKS</a> WERE CONSUMED BY <a href="https://x.com/portionclub69" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>PORTIONCLUB69</a> AND FRIENDS DURING THE CREATION OF LAWBSTARZ v1 ☆
        </p>
        <p>Chain: Ethereum</p>
        <p>
          Collect on <a href="https://magiceden.us/collections/ethereum/0xd7922cd333da5ab3758c95f774b092a7b13a5449" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>Secondary</a>
        </p>
        <img src="/assets/lawbstarz.gif" alt="Lawbstarz" style={{ maxWidth: '100%', marginTop: '10px' }} />
        <blockquote className="twitter-tweet" data-media-max-width="560">
          <p lang="en" dir="ltr">The following 🧵 has been transcripted from a live news broadcast:<br/><br/>Anchor: &ldquo;Good evening, viewers. Tonight, we embark on an extraordinary journey that defies rational explanation. It all began with February&apos;s Cigawrette Packs cargo ship hijacking, little did we know that the.. <a href="https://t.co/BWgLOk59N4">pic.twitter.com/BWgLOk59N4</a></p>&mdash; wables (@wables411) <a href="https://twitter.com/wables411/status/1669009492007354369?ref_src=twsrc%5Etfw">June 14, 2023</a>
        </blockquote>
        <script async src="https://platform.twitter.com/widgets.js"></script>
        <img src="/assets/lawbstarzhotelroom.png" alt="Lawbstarz Hotel Room" style={{ maxWidth: '100%', marginTop: '10px' }} />
        <img src="/assets/tile-06-audio-image0-lawbstarz dj set 1.0 copy.png" alt="Lawbstarz DJ Set" style={{ maxWidth: '100%', marginTop: '10px' }} />
      </Popup>

      <Popup id="lawbstation-popup" isOpen={activePopup === 'lawbstation-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        <p style={{marginBottom: '10px'}}>
          Lawbstations: low poly Lawbsters viewed through various cathode-ray tubes built on <a href="https://www.miladystation2.net/" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>MiladyStation</a> technology. Inspired by Milady, Allstarz, Rusty Rollers, Cigawrette Packs, SPX6900 and Radbro. Brought to you in part by PortionClub and Mony Corp Group. LawbStations seem nice but a lobster controlled by MiladyStation will never achieve anything without a roadmap.
        </p>
        <p style={{marginBottom: '10px'}}>Chain: Solana</p>
        <p style={{marginBottom: '10px'}}>
          <a href="https://magiceden.us/marketplace/lawbstation" target="_blank" rel="noopener noreferrer">Collect Lawbstations on Secondary</a>
        </p>
        <img src="/assets/lawbstation.GIF" alt="Lawbstation" style={{ width: '100%', marginTop: '10px' }} />
        <video controls src="/assets/lawbstation.mp4" style={{ width: '100%', marginTop: '10px' }} />
      </Popup>
      
      <Popup id="nexus-popup" isOpen={activePopup === 'nexus-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        <p style={{marginBottom: '10px'}}>
          1000 Xtra Ultra High Definition Lawbsters, packaged and distributed on Solana. Collect on <a href="https://magiceden.us/marketplace/lawbnexus" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>Secondary</a>
        </p>
        <img src="/assets/nexus.gif" alt="Nexus" style={{ width: '100%', marginBottom: '10px' }} />
        <video controls src="/assets/nexusminting.mp4" style={{ width: '100%' }} />
      </Popup>

      <Popup id="lawbsters-popup" isOpen={activePopup === 'lawbsters-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        <p style={{marginBottom: '10px'}}>
          420 Lawbsters seem nice but a human controlled by a lobster would never amount to anything without a roadmap. A <a href="https://www.cigawrettepacks.shop/" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>Cigawrette Packs</a> derivative.
        </p>
        <p>Chain: Ethereum</p>
        <p style={{marginBottom: '10px'}}>
          Collect on <a href="https://magiceden.us/collections/ethereum/0x0ef7ba09c38624b8e9cc4985790a2f5dbfc1dc42" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>Secondary</a> or <a href="https://v2.nftx.io/vault/0xdb98a1ae711d8bf186a8da0e81642d81e0f86a05/buy/" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>NFTX</a>
        </p>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <Tweet id="1620879129850834944" />
        </div>
        <img src="/assets/lawbsters.gif" alt="Lawbsters" style={{ width: '100%', marginTop: '10px' }} />
      </Popup>

      <Popup id="pixelawbs-popup" isOpen={activePopup === 'pixelawbs-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        {(() => {
          const handleCollectHere = (e: React.MouseEvent<HTMLSpanElement>) => {
            e.preventDefault();
            setActivePopup(null);
            setShowMintPopup(true);
          };
          return (
            <>
              <p style={{marginBottom: '10px'}}>
                PIXELAWBS NOW MINTING ON ETHEREUM! CONNECT WALLET AND <span style={{color: 'blue', textDecoration: 'underline', cursor: 'pointer'}} onClick={handleCollectHere}>COLLECT HERE</span> OR VISIT <a href="https://www.scatter.art/collection/pixelawbs" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>SCATTER.ART</a>
              </p>
              <video controls src="/assets/pixelawbs.mp4" style={{ width: '100%', marginBottom: '10px' }} preload="none" poster="/assets/pixelawbsintro.png" />
              <p style={{marginBottom: '10px'}}>
                2222 Pixelated Lawbsters inspired by <a href="https://pixeladymaker.net/" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>PixeladyMaker</a>
              </p>
              <p style={{marginBottom: '10px'}}>Chain: Ethereum</p>
              <p style={{marginBottom: '10px'}}>
                Collect on <a href="https://magiceden.us/collections/ethereum/0x2d278e95b2fc67d4b27a276807e24e479d9707f6" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>Secondary</a>
              </p>
              <img src="/assets/mint.gif" alt="Mint" style={{ maxWidth: '100%' }} />
            </>
          );
        })()}
      </Popup>

      <Popup id="halloween-popup" isOpen={activePopup === 'halloween-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        <h3 style={{marginBottom: '10px'}}>A LAWBSTER HALLOWEEN</h3>
        <p style={{marginBottom: '10px'}}>
          a Lawbster Halloween party seems nice but a a group of what seems to be humans controlled by lobsters just hijacked the Spirit Halloween Superstore.
        </p>
        <p style={{marginBottom: '10px'}}>Chain: Base</p>
        <p style={{marginBottom: '10px'}}>
          Collect on <a href="https://magiceden.us/collections/base/0x8ab6733f8f8702c233f3582ec2a2750d3fc63a97" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>Secondary</a>
        </p>
        <img src="/assets/lawbsterhalloween.gif" alt="Lawbster Halloween" style={{ width: '100%', marginBottom: '10px' }} />
        <div ref={tiktokRef} style={{ maxWidth: '400px', margin: '0 auto' }}>
          <blockquote 
            className="tiktok-embed" 
            cite="https://www.tiktok.com/@wables.eth/video/7295660710644682027" 
            data-video-id="7295660710644682027" 
            style={{maxWidth: '605px', minWidth: '325px'}}
          >
            <section>
              <a target="_blank" rel="noreferrer" title="@wables.eth" href="https://www.tiktok.com/@wables.eth?refer=embed">@wables.eth</a> 420 lawbsters hijacked a spirit halloween superstore 🦞🎃 minting rn on @ourzora via @PC69 <a target="_blank" rel="noreferrer" title="♬ original sound - wables.eth" href="https://www.tiktok.com/music/original-sound-7295660837769857835?refer=embed">♬ original sound - wables.eth</a>
            </section>
          </blockquote>
        </div>
      </Popup>

      <Popup id="lawb-popup" isOpen={activePopup === 'lawb-popup'} onClose={closePopup} onMinimize={minimizePopup}>
        <h1 style={{marginBottom: '10px'}}>
          <a href="https://dexscreener.com/solana/dtxvuypheobwo66afefp9mfgt2e14c6ufexnvxwnvep" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>🦞 $LAWB</a>
        </h1>
        <p style={{marginBottom: '10px'}}>
          $lawb seems nice but a lawbster token on the Solana blockchain will never achieve anything without a roadmap. Token created 03.15.24 on <a href="https://www.pump.fun/65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>pump.fun</a>.
        </p>
        <p style={{marginBottom: '10px'}}>$lawb airdropped to LawbStation holders 03.19.24</p>
        <p style={{marginBottom: '10px'}}>THERE IS NO MEME WE $LAWB YOU</p>
        <p style={{marginBottom: '10px'}}>(sol) ca: 65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6</p>
        <p style={{marginBottom: '10px'}}>(arb) ca: 0x741f8FbF42485E772D97f1955c31a5B8098aC962</p>
        <p style={{marginBottom: '10px'}}>(dmt) ca: 0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F</p>
        <p style={{marginBottom: '10px'}}>
          if you wish to bridge your $lawb token from solana to arbitrum to sanko, visit <a href="https://portalbridge.com/" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>https://portalbridge.com/</a>
        </p>
        <p style={{marginBottom: '10px'}}>step 1. connect solana wallet and select $lawb token (65GVcFcSqQcaMNeBkYcen4ozeT83tr13CeDLU4sUUdV6)</p>
        <p style={{marginBottom: '10px'}}>step 2. connect arbitrum wallet and select $lawb token (0x741f8FbF42485E772D97f1955c31a5B8098aC962)</p>
        <p style={{marginBottom: '10px'}}>step 3. select token quantity, confirm transactions.</p>
        <p style={{marginBottom: '10px'}}>step 4. now that you have $lawb on arbitrum, visit <a href="https://sanko.xyz/bridge" target="_blank" rel="noopener noreferrer" style={{color: 'blue', textDecoration: 'underline'}}>https://sanko.xyz/bridge</a> and connect your arb wallet.</p>
        <p style={{marginBottom: '10px'}}>step 5. from arb wallet, select $lawb token.</p>
        <p style={{marginBottom: '10px'}}>step 6. connect to sanko chain. if not already selected, select $lawb token on sanko (0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F)</p>
        <p style={{marginBottom: '10px'}}>step 7. select quantity and confirm transactions.</p>

        <img src="/assets/lawbticker.gif" alt="ticker $lawb" style={{ width: '100%', marginBottom: '10px', marginTop: '10px' }} />

        <div style={{ width: '100%', height: '400px', marginTop: '10px' }}>
          <iframe 
            height="100%" 
            width="100%" 
            id="geckoterminal-embed" 
            title="GeckoTerminal Embed" 
            src="https://www.geckoterminal.com/solana/pools/DTxVuYphEobWo66afEfP9MfGt2E14C6UfeXnvXWnvep?embed=1&info=1&swaps=0&grayscale=0&light_chart=0&chart_type=market_cap&resolution=15m" 
            frameBorder="0" 
            allow="clipboard-write" 
            allowFullScreen
          />
        </div>
      </Popup>

      <MintPopup 
        isOpen={showMintPopup} 
        onClose={closeMintPopup} 
        onMinimize={minimizeMintPopup}
        walletAddress={address || ''} 
      />

      <NFTGallery 
        isOpen={showNFTGallery} 
        onClose={closeNFTGallery} 
        onMinimize={minimizeNFTGallery}
        walletAddress={address} 
      />

      <Popup id="meme-generator-popup" isOpen={showMemeGenerator} onClose={closeMemeGenerator} onMinimize={minimizeMemeGenerator}>
        <MemeGenerator />
      </Popup>



    </div>
  );
}

export default App;