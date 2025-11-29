import React, { useRef, useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { getCollectionNFTs, getOpenSeaNFTs, getOpenSeaSolanaNFTs } from '../mint';
import { v4 as uuidv4 } from 'uuid';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    background: '#8b956d', // Game Boy green
    border: '4px solid #000',
    borderRadius: 12,
    maxWidth: '100%',
    width: '100%',
    fontFamily: 'monospace',
    fontSize: 10,
    boxSizing: 'border-box',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: '#0f380f',
    fontSize: '7px',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 1.1,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flexShrink: 0,
    width: '200px',
    minWidth: '180px',
    maxHeight: '100%',
    overflowY: 'auto',
    paddingRight: 4,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#0f380f',
    fontSize: 9,
    borderBottom: '1px solid #0f380f',
    paddingBottom: 1,
    marginBottom: 2,
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginBottom: 2,
  },
  label: {
    color: '#0f380f',
    fontWeight: 'bold',
    fontSize: 8,
    marginBottom: 1,
  },
  input: {
    width: '100%',
    padding: '2px 4px',
    border: '2px inset #8b956d',
    background: '#c4cfa1',
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#0f380f',
    textTransform: 'uppercase',
    boxSizing: 'border-box',
  },
  button: {
    padding: '3px 6px',
    background: '#c4cfa1', // Game Boy button color
    border: '2px outset #8b956d',
    borderBottom: '2px solid #5a5a5a',
    borderRight: '2px solid #5a5a5a',
    cursor: 'pointer',
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f380f',
    borderRadius: 2,
    width: '100%',
    '&:hover': {
      background: '#d4dfb1',
    },
    '&:active': {
      border: '2px inset #8b956d',
      borderTop: '2px solid #5a5a5a',
      borderLeft: '2px solid #5a5a5a',
    },
  },
  effectButton: {
    padding: '2px 4px',
    background: '#c4cfa1',
    border: '2px outset #8b956d',
    borderBottom: '2px solid #5a5a5a',
    borderRight: '2px solid #5a5a5a',
    cursor: 'pointer',
    fontSize: 7,
    fontWeight: 'bold',
    color: '#0f380f',
    borderRadius: 2,
    flex: 1,
    '&:hover': {
      background: '#d4dfb1',
    },
    '&:active': {
      border: '2px inset #8b956d',
      borderTop: '2px solid #5a5a5a',
      borderLeft: '2px solid #5a5a5a',
    },
  },
  memeArea: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    background: '#0f380f', // Dark Game Boy screen
    border: '3px inset #000',
    borderRadius: 4,
    padding: 8,
  },
  canvas: {
    border: '2px inset #000',
    background: '#9bbc0f', // Game Boy screen green
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
  },
  dropdown: {
    position: 'relative',
  },
  dropdownContent: {
    position: 'absolute',
    top: '100%',
    left: 0,
    background: '#fff',
    border: '2px outset #fff',
    borderRadius: 4,
    zIndex: 10,
    minWidth: 100,
    maxHeight: 100,
    overflowY: 'auto',
  },
  dropdownItem: {
    padding: '3px 5px',
    cursor: 'pointer',
    fontSize: 9,
    borderBottom: '1px solid #eee',
    '&:hover': {
      background: '#f0f0f0',
    },
  },
  actions: {
    display: 'flex',
    gap: 3,
    justifyContent: 'center',
    marginTop: 1,
  },
});

const NFT_COLLECTIONS = [
  { id: 'lawbsters', name: 'Lawbsters', api: 'opensea', slug: 'lawbsters', chain: 'ethereum' },
  { id: 'lawbstarz', name: 'Lawbstarz', api: 'opensea', slug: 'lawbstarz', chain: 'ethereum' },
  { id: 'pixelawbs', name: 'Pixelawbsters', api: 'scatter', slug: 'pixelawbs' },
  { id: 'halloween', name: 'Halloween Lawbsters', api: 'opensea', slug: 'a-lawbster-halloween', chain: 'base' },
  // Solana collections - using Helius API
  { id: 'lawbstation', name: 'Lawbstation', api: 'opensea-solana', slug: 'lawbstation', chain: 'solana' },
  { id: 'nexus', name: 'Nexus', api: 'opensea-solana', slug: 'lawbnexus', chain: 'solana' },
];

// Sticker type
interface Sticker {
  id: string;
  src: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

const STOCK_STICKERS = [
  '/images/sticker1.png',
  '/images/sticker2.png',
  '/images/sticker3.png',
  '/images/sticker4.png',
  '/images/sticker5.png',
];

// Canvas size will be dynamic based on container
const DEFAULT_CANVAS_SIZE = 400;

function MemeGenerator() {
  const classes = useStyles();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(DEFAULT_CANVAS_SIZE);
  // State for image
  const [nftImage, setNftImage] = useState<string | null>(null);
  // State for text
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [topFontSize, setTopFontSize] = useState(50);
  const [bottomFontSize, setBottomFontSize] = useState(50);
  // State for effects
  const [deepFry, setDeepFry] = useState(false);
  const [pixelate, setPixelate] = useState(false);
  const [grain, setGrain] = useState(false);
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const [loadingNft, setLoadingNft] = useState(false);
  // Sticker state
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  // Add placing state
  const [placingStickerId, setPlacingStickerId] = useState<string | null>(null);
  
  // Calculate canvas size based on container - use full available space
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && canvasRef.current) {
        const container = containerRef.current;
        const memeArea = container.querySelector('[class*="memeArea"]') as HTMLElement;
        if (memeArea) {
          const availableWidth = memeArea.clientWidth - 16; // padding
          const availableHeight = memeArea.clientHeight - 16; // padding
          // Use the smaller dimension to keep it square, but use full available space
          const size = Math.min(availableWidth, availableHeight);
          if (size > 0) {
            setCanvasSize(size);
          }
        }
      }
    };
    
    // Use a small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateCanvasSize, 100);
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // drawText and applyEffectsSafely moved inside drawMeme
  const drawMemeToCanvas = async (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw background image - fill entire canvas
    if (nftImage) {
      await new Promise<void>((resolve) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Stretch image to fill entire canvas (match width and height exactly)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = nftImage;
      });
    } else {
      ctx.fillStyle = '#9bbc0f'; // Game Boy screen green
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Draw text
    const drawText = (ctx: CanvasRenderingContext2D) => {
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'white'; // Add white fill color
      
      const wrapText = (text: string, maxWidth: number) => {
        const words = text.toUpperCase().split(' '); // Convert to uppercase
        const lines: string[] = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const width = ctx.measureText(currentLine + ' ' + word).width;
          if (width < maxWidth) {
            currentLine += ' ' + word;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine);
        return lines;
      };
      
      // Top text - constrained to image (canvas)
      if (topText) {
        ctx.font = `${topFontSize}px Impact`;
        const maxWidth = canvas.width - 20; // Padding from edges
        const lines = wrapText(topText, maxWidth);
        lines.forEach((line, index) => {
          const y = topFontSize + (index * topFontSize * 1.2);
          // Ensure text stays within canvas bounds
          if (y <= canvas.height - 10) { // Leave space for bottom text
            ctx.strokeText(line, canvas.width / 2, y);
            ctx.fillText(line, canvas.width / 2, y);
          }
        });
      }
      
      // Bottom text - constrained to image (canvas)
      if (bottomText) {
        ctx.font = `${bottomFontSize}px Impact`;
        const maxWidth = canvas.width - 20; // Padding from edges
        const lines = wrapText(bottomText, maxWidth);
        lines.forEach((line, index) => {
          const y = canvas.height - (lines.length - index) * bottomFontSize * 1.2 + bottomFontSize; // Position from bottom edge
          // Ensure text stays within canvas bounds
          if (y >= 10) { // Leave space for top text
            ctx.strokeText(line, canvas.width / 2, y);
            ctx.fillText(line, canvas.width / 2, y);
          }
        });
      }
    };
    drawText(ctx);
    // Draw stickers (wait for all images to load)
    await Promise.all(stickers.map(sticker => new Promise<void>(resolve => {
      const img = new window.Image();
      img.src = sticker.src;
      img.onload = () => {
        ctx.save();
        const stickerSize = 80 * sticker.scale;
        ctx.save();
        ctx.translate(sticker.x, sticker.y);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.scale(sticker.scale, sticker.scale);
        ctx.drawImage(img, -40, -40, 80, 80);
        ctx.restore();
        ctx.restore();
        resolve();
      };
      img.onerror = () => resolve();
    })));
    // Apply effects last
    try {
      if (deepFry) applyDeepFry(canvas);
      if (pixelate) applyPixelate(canvas);
      if (grain) applyGrain(canvas);
    } catch (error: unknown) {
      console.warn('Effects could not be applied due to CORS restrictions. Try uploading your own image instead.', error);
      setDeepFry(false);
      setPixelate(false);
      setGrain(false);
    }
  };

  // Effect functions
  const applyDeepFry = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Increase saturation and sharpening
      const avg = (r + g + b) / 3;
      const saturation = 1.8; // Increased saturation
      
      // Boost colors with better saturation
      data[i] = Math.min(255, avg + (r - avg) * saturation);     // Red
      data[i + 1] = Math.min(255, avg + (g - avg) * saturation * 0.7); // Green (reduced for warmer tone)
      data[i + 2] = Math.min(255, avg + (b - avg) * saturation * 0.4); // Blue (reduced for warmer tone)
      
      // Add sharpening effect
      const sharpness = 1.3;
      data[i] = Math.min(255, Math.max(0, data[i] * sharpness));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * sharpness));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * sharpness));
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const applyPixelate = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const pixelSize = 4; // Reduced from 8 to 4 for less pixelation
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const newData = new Uint8ClampedArray(data);
    
    for (let y = 0; y < canvas.height; y += pixelSize) {
      for (let x = 0; x < canvas.width; x += pixelSize) {
        // Get the color of the first pixel in this block
        const index = (y * canvas.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        
        // Fill the entire block with this color
        for (let py = 0; py < pixelSize && y + py < canvas.height; py++) {
          for (let px = 0; px < pixelSize && x + px < canvas.width; px++) {
            const newIndex = ((y + py) * canvas.width + (x + px)) * 4;
            newData[newIndex] = r;
            newData[newIndex + 1] = g;
            newData[newIndex + 2] = b;
            newData[newIndex + 3] = a;
          }
        }
      }
    }
    
    ctx.putImageData(new ImageData(newData, canvas.width, canvas.height), 0, 0);
  };

  const applyGrain = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 50; // Increased from 30 to 50 for more grain
      
      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // Red
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // Green
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  // Redraw when text, image, or effects change
  useEffect(() => {
    if (canvasRef.current) {
      void drawMemeToCanvas(canvasRef.current);
    }
  }, [drawMemeToCanvas]);

  // Mobile long press handlers
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressDelay = 500; // 500ms for long press

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    
    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Show mobile context menu
      if (navigator.share) {
        // Use native sharing if available
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'meme.png', { type: 'image/png' });
            navigator.share({
              title: 'Lawb Meme',
              text: 'Check out this meme I made!',
              files: [file]
            }).catch(() => {
              // Fallback to download if sharing fails
              handleSave();
            });
          }
        });
      } else {
        // Fallback to download
        handleSave();
      }
    }, longPressDelay);
  };

  const handleCanvasTouchEnd = () => {
    // Clear the timer if touch ends before long press
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCanvasTouchMove = () => {
    // Clear the timer if finger moves (prevents accidental long press)
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Prevent context menu on right click for desktop
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNftImage(URL.createObjectURL(file));
    }
  };
  const handleRestart = () => {
    setNftImage(null);
    setTopText('');
    setBottomText('');
    setTopFontSize(50);
    setBottomFontSize(50);
    setDeepFry(false);
    setPixelate(false);
    setGrain(false);
  };
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await drawMemeToCanvas(canvas);
    const link = document.createElement('a');
    link.download = 'meme.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch a random NFT image from a collection
  const handlePickRandomNft = async (collection: typeof NFT_COLLECTIONS[0]) => {
    setLoadingNft(true);
    setShowCollectionDropdown(false);
    try {
      console.log('Fetching NFTs for collection:', collection);
      let nfts;
      if (collection.api === 'opensea') {
        console.log('Using OpenSea API for:', collection.slug);
        const resp = await getOpenSeaNFTs(collection.slug, 50);
        nfts = resp.data;
        console.log('OpenSea response:', resp);
      } else if (collection.api === 'opensea-solana') {
        console.log('Using Helius API for Solana collection:', collection.slug);
        const resp = await getOpenSeaSolanaNFTs(collection.slug, 50);
        nfts = resp.data;
        console.log('Helius Solana response:', resp);
        
        // If no NFTs found, show helpful message
        if (!nfts || nfts.length === 0) {
          alert('No NFTs found in this Solana collection. Try uploading your own image or use other collections.');
          return;
        }
      } else {
        console.log('Using Scatter API for:', collection.slug);
        const resp = await getCollectionNFTs(collection.slug, 1, 50);
        nfts = resp.data;
        console.log('Scatter response:', resp);
      }
      if (nfts && nfts.length > 0) {
        const randomNft = nfts[Math.floor(Math.random() * nfts.length)];
        const imageUrl = randomNft.image || randomNft.image_url || randomNft.image_url_shrunk;
        console.log('Selected NFT:', randomNft);
        console.log('Image URL:', imageUrl);
        setNftImage(imageUrl);
      } else {
        console.log('No NFTs found in collection');
        alert('No NFTs found in this collection.');
      }
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      alert('Failed to fetch NFT images. Check console for details.');
    } finally {
      setLoadingNft(false);
    }
  };

  // Improved addSticker: use functional setStickers, prevent duplicates, and set placingStickerId
  const addSticker = (src: string) => {
    const newSticker = {
      id: uuidv4(),
      src,
      x: 80,
      y: 80,
      scale: 1,
      rotation: 0,
    };
    setStickers(prev => {
      if (prev.length >= 2) return prev;
      // Prevent adding the same sticker twice in rapid succession
      if (prev.some(s => s.src === src && !s.id.startsWith('upload-'))) return prev;
      return [
        ...prev,
        newSticker,
      ];
    });
    setPlacingStickerId(newSticker.id as string);
  };
  // Upload sticker handler
  const handleStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      addSticker(url);
    }
  };
  // Less sensitive rotation
  const handleStickerRotate = (id: string, startAngle: number, startRotation: number, clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    
    setStickers(stickers => stickers.map(s => {
      if (s.id !== id) return s;
      const centerX = s.x;
      const centerY = s.y;
      const angle = Math.atan2(canvasY - centerY, canvasX - centerX) * 180 / Math.PI;
      return { ...s, rotation: startRotation + (angle - startAngle) * 0.5 }; // Slow down rotation
    }));
  };
  // Place sticker mode logic - activate sticker when clicked
  const handleStickerClick = (id: string) => {
    setPlacingStickerId(id); // Always activate when clicked
  };
  // Remove sticker
  const removeSticker = (id: string) => {
    setStickers(stickers => stickers.filter(s => s.id !== id));
  };

  // Less sensitive resize
  const handleStickerResize = (id: string, clientX: number, startX: number, startScale: number) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    
    const delta = (clientX - startX) * scaleX / 80;
    setStickers(stickers => stickers.map(s => 
      s.id === id ? { ...s, scale: Math.max(0.2, Math.min(3, startScale + delta * 0.2)) } : s
    ));
  };

  return (
    <div className={classes.container} ref={containerRef} style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
      <div className={classes.content}>
        <div className={classes.header}>
          <h2 style={{ color: '#0f380f', textShadow: '1px 1px 0 #c4cfa1', marginBottom: 2, fontSize: '11px', textAlign: 'center' }}>LAWB MEME MAKER</h2>
          <p className={classes.subtitle}>
            <a href="https://memedepot.com/d/lawb" target="_blank" rel="noopener noreferrer" style={{ color: '#0f380f', textDecoration: 'underline' }}>
              MEME DEPOT
            </a>
          </p>
        </div>
        <div className={classes.section}>
          <div className={classes.sectionTitle}>Collections</div>
          <div className={classes.row}>
            <div className={classes.dropdown}>
              <button className={classes.button} onClick={() => setShowCollectionDropdown(v => !v)}>
                Collections
              </button>
              {showCollectionDropdown && (
                <div className={classes.dropdownContent}>
                  {NFT_COLLECTIONS.map(col => (
                    <div key={col.id} className={classes.dropdownItem} onClick={() => { void handlePickRandomNft(col); }}>
                      {col.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <label className={classes.button} style={{ marginBottom: 0 }}>
              Upload Image
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>
            {loadingNft && <span style={{ color: '#00ffff', marginLeft: 8, fontSize: '12px' }}>Loading NFT...</span>}
          </div>
        </div>
        <div className={classes.section}>
          <div className={classes.sectionTitle}>Text</div>
          <div className={classes.row}>
            <span className={classes.label}>Top Text:</span>
            <input className={classes.input} type="text" value={topText} onChange={e => setTopText(e.target.value)} placeholder="Enter top text..." />
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
              <span className={classes.label} style={{ marginBottom: 0, minWidth: '30px' }}>Size:</span>
              <input className={classes.input} type="number" min={10} max={100} value={topFontSize} onChange={e => setTopFontSize(Number(e.target.value))} style={{ width: '60px', textAlign: 'center' }} />
            </div>
          </div>
          <div className={classes.row}>
            <span className={classes.label}>Bottom Text:</span>
            <input className={classes.input} type="text" value={bottomText} onChange={e => setBottomText(e.target.value)} placeholder="Enter bottom text..." />
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
              <span className={classes.label} style={{ marginBottom: 0, minWidth: '30px' }}>Size:</span>
              <input className={classes.input} type="number" min={10} max={100} value={bottomFontSize} onChange={e => setBottomFontSize(Number(e.target.value))} style={{ width: '60px', textAlign: 'center' }} />
            </div>
          </div>
        </div>
        <div className={classes.section}>
          <div className={classes.sectionTitle}>Effects</div>
          <div className={classes.row}>
            <button className={classes.effectButton} style={{ background: deepFry ? '#0f380f' : undefined, color: deepFry ? '#c4cfa1' : undefined }} onClick={() => setDeepFry(v => !v)}>Deep Fry</button>
            <button className={classes.effectButton} style={{ background: pixelate ? '#0f380f' : undefined, color: pixelate ? '#c4cfa1' : undefined }} onClick={() => setPixelate(v => !v)}>Pixelate</button>
            <button className={classes.effectButton} style={{ background: grain ? '#0f380f' : undefined, color: grain ? '#c4cfa1' : undefined }} onClick={() => setGrain(v => !v)}>Grain</button>
          </div>
        </div>
        <div className={classes.section}>
          <div className={classes.sectionTitle}>Stickers</div>
          <div className={classes.row}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginBottom: 4 }}>
              {STOCK_STICKERS.map((src, i) => (
                <img key={src} src={src} alt={`sticker${i+1}`} style={{ width: '100%', aspectRatio: '1', cursor: 'pointer', border: '1px solid #0f380f', borderRadius: 2 }} onClick={() => addSticker(src)} />
              ))}
            </div>
            <label className={classes.button} style={{ marginBottom: 0 }}>
              Upload Sticker
              <input type="file" accept="image/*" style={{ display: 'none' }} ref={stickerInputRef} onChange={handleStickerUpload} />
            </label>
          </div>
        </div>
        <div className={classes.actions}>
          <button className={classes.button} onClick={handleSave}>Save Image</button>
          <button className={classes.button} onClick={handleRestart}>Restart</button>
        </div>
      </div>

      <div className={classes.memeArea} style={{ position: 'relative' }}>
        <canvas 
          ref={canvasRef} 
          width={canvasSize} 
          height={canvasSize} 
          className={classes.canvas}
          onTouchStart={handleCanvasTouchStart}
          onTouchEnd={handleCanvasTouchEnd}
          onTouchMove={handleCanvasTouchMove}
          onContextMenu={handleCanvasContextMenu}
          style={{ touchAction: 'none', width: `${canvasSize}px`, height: `${canvasSize}px` }}
        />
        
        {/* Overlay stickers for manipulation */}
        {canvasRef.current && stickers.map(sticker => {
          const rect = canvasRef.current!.getBoundingClientRect();
          const scale = rect.width / canvasSize;
          const stickerSize = 80 * sticker.scale * scale;
          
          return (
            <div
              key={sticker.id}
              style={{
                position: 'absolute',
                left: `${(sticker.x / canvasSize) * 100}%`,
                top: `${(sticker.y / canvasSize) * 100}%`,
                width: `${(80 * sticker.scale / canvasSize) * 100}%`,
                height: `${(80 * sticker.scale / canvasSize) * 100}%`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                cursor: placingStickerId === sticker.id ? 'move' : 'pointer',
                pointerEvents: 'auto',
                zIndex: 10,
                border: placingStickerId === sticker.id ? '2px solid #0f380f' : 'none',
                boxShadow: placingStickerId === sticker.id ? '0 0 8px #0f380f' : 'none',
              }}
              onClick={() => handleStickerClick(sticker.id)}
              onMouseDown={e => {
                if (placingStickerId === sticker.id) {
                  e.stopPropagation();
                  setActiveStickerId(sticker.id);
                  const rect = canvasRef.current!.getBoundingClientRect();
                  const startCanvasX = sticker.x;
                  const startCanvasY = sticker.y;
                  const startMouseX = e.clientX;
                  const startMouseY = e.clientY;
                  const onMove = (moveEvent: MouseEvent) => {
                    const scaleX = canvasSize / rect.width;
                    const scaleY = canvasSize / rect.height;
                    const deltaX = (moveEvent.clientX - startMouseX) * scaleX;
                    const deltaY = (moveEvent.clientY - startMouseY) * scaleY;
                    const newX = startCanvasX + deltaX;
                    const newY = startCanvasY + deltaY;
                    const halfW = 40 * sticker.scale;
                    const halfH = 40 * sticker.scale;
                    setStickers(stickers => stickers.map(s => 
                      s.id === sticker.id ? { 
                        ...s, 
                        x: Math.max(halfW, Math.min(canvasSize - halfW, newX)),
                        y: Math.max(halfH, Math.min(canvasSize - halfH, newY))
                      } : s
                    ));
                  };
                  const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                    setActiveStickerId(null);
                  };
                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onUp);
                }
              }}
            >
              <img src={sticker.src} alt="sticker" style={{ width: '100%', height: '100%', userSelect: 'none', pointerEvents: 'none' }} draggable={false} />
              {placingStickerId === sticker.id && (
                <>
                  {/* Rotate handle */}
                  <div style={{ position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', background: '#c4cfa1', borderRadius: '50%', border: '2px solid #0f380f', cursor: 'grab', zIndex: 11 }}
                    onMouseDown={e => {
                      e.stopPropagation();
                      const rect = canvasRef.current!.getBoundingClientRect();
                      const centerX = rect.left + rect.width * (sticker.x / canvasSize);
                      const centerY = rect.top + rect.height * (sticker.y / canvasSize);
                      const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
                      const startRotation = sticker.rotation;
                      const onMove = (moveEvent: MouseEvent) => {
                        handleStickerRotate(sticker.id, startAngle, startRotation, moveEvent.clientX, moveEvent.clientY);
                      };
                      const onUp = () => {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                      };
                      window.addEventListener('mousemove', onMove);
                      window.addEventListener('mouseup', onUp);
                    }}
                  />
                  {/* Resize handle */}
                  <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '20px', height: '20px', background: '#c4cfa1', borderRadius: '50%', border: '2px solid #0f380f', cursor: 'nwse-resize', zIndex: 11 }}
                    onMouseDown={e => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startScale = sticker.scale;
                      const onMove = (moveEvent: MouseEvent) => {
                        handleStickerResize(sticker.id, moveEvent.clientX, startX, startScale);
                      };
                      const onUp = () => {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                      };
                      window.addEventListener('mousemove', onMove);
                      window.addEventListener('mouseup', onUp);
                    }}
                  />
                  {/* Remove sticker button */}
                  <button style={{ position: 'absolute', top: '-20px', left: '-20px', width: '20px', height: '20px', background: '#8b956d', color: '#0f380f', border: '2px solid #0f380f', borderRadius: '50%', fontSize: '12px', cursor: 'pointer', zIndex: 12, fontWeight: 'bold' }} onClick={(e) => { e.stopPropagation(); removeSticker(sticker.id); }}>×</button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MemeGenerator;