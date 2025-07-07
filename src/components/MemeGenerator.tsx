import React, { useRef, useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { getCollectionNFTs, getOpenSeaNFTs, getOpenSeaSolanaNFTs } from '../mint';
import { v4 as uuidv4 } from 'uuid';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 4,
    background: '#c0c0c0',
    border: '2px outset #fff',
    borderRadius: 8,
    maxWidth: 500,
    width: '100%',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  header: {
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    color: '#000',
    fontSize: '10px',
    textAlign: 'center',
    marginBottom: 2,
    lineHeight: 1.1,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 11,
    borderBottom: '1px solid #888',
    paddingBottom: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    flexWrap: 'wrap',
  },
  label: {
    minWidth: 55,
    color: '#000',
    fontWeight: 'bold',
    fontSize: 10,
  },
  input: {
    flex: 1,
    minWidth: 70,
    padding: '2px 3px',
    border: '2px inset #fff',
    background: '#fff',
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#000',
    textTransform: 'uppercase',
  },
  button: {
    padding: '3px 8px',
    background: '#c0c0c0',
    border: '2px outset #fff',
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    '&:hover': {
      background: '#d0d0d0',
    },
    '&:active': {
      border: '2px inset #fff',
    },
  },
  effectButton: {
    padding: '2px 5px',
    background: '#c0c0c0',
    border: '2px outset #fff',
    cursor: 'pointer',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
    '&:hover': {
      background: '#d0d0d0',
    },
    '&:active': {
      border: '2px inset #fff',
    },
  },
  memeArea: {
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 1,
  },
  canvas: {
    border: '2px inset #fff',
    background: '#333',
    maxWidth: '100%',
    height: 'auto',
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

// Update canvas size constants
const CANVAS_SIZE = 500;

function MemeGenerator() {
  const classes = useStyles();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // State for image
  const [nftImage, setNftImage] = useState<string | null>(null);
  // State for text
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [topFontSize, setTopFontSize] = useState(36);
  const [bottomFontSize, setBottomFontSize] = useState(36);
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

  // drawText and applyEffectsSafely moved inside drawMeme
  const drawMemeToCanvas = async (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw background image
    if (nftImage) {
      await new Promise<void>((resolve) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = nftImage;
      });
    } else {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Draw text
    const drawText = (ctx: CanvasRenderingContext2D) => {
      ctx.textAlign = 'center';
      // Function to wrap text
      const wrapText = (text: string, maxWidth: number) => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
          const width = ctx.measureText(testLine).width;
          if (width <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = words[i];
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };
      // Draw top text
      if (topText) {
        ctx.font = `bold ${topFontSize}px Impact`;
        const maxWidth = canvas.width * 0.9;
        const lines = wrapText(topText, maxWidth);
        lines.forEach((line, index) => {
          const y = topFontSize + 10 + (index * topFontSize * 1.2);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 4;
          ctx.strokeText(line, canvas.width / 2, y);
          ctx.fillStyle = '#fff';
          ctx.fillText(line, canvas.width / 2, y);
        });
      }
      // Draw bottom text
      if (bottomText) {
        ctx.font = `bold ${bottomFontSize}px Impact`;
        const maxWidth = canvas.width * 0.9;
        const lines = wrapText(bottomText, maxWidth);
        const bottomMargin = 12;
        lines.forEach((line, index) => {
          const y = canvas.height - bottomMargin - ((lines.length - 1 - index) * bottomFontSize * 1.2);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 4;
          ctx.strokeText(line, canvas.width / 2, y);
          ctx.fillStyle = '#fff';
          ctx.fillText(line, canvas.width / 2, y);
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
        ctx.translate(sticker.x, sticker.y);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.scale(sticker.scale, sticker.scale);
        ctx.drawImage(img, -40, -40, 80, 80);
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
    setTopFontSize(36);
    setBottomFontSize(36);
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
        console.log('Using OpenSea Solana API for:', collection.slug);
        const resp = await getOpenSeaSolanaNFTs(collection.slug, 50);
        nfts = resp.data;
        console.log('OpenSea Solana response:', resp);
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
  // Adjust drag sensitivity for more natural movement
  const handleStickerDrag = (id: string, dx: number, dy: number) => {
    setStickers(stickers => stickers.map(s => {
      if (s.id !== id) return s;
      let newX = s.x + dx / 1.2; // Slightly less slow
      let newY = s.y + dy / 1.2;
      const halfW = 40 * s.scale;
      const halfH = 40 * s.scale;
      newX = Math.max(halfW, Math.min(CANVAS_SIZE - halfW, newX));
      newY = Math.max(halfH, Math.min(CANVAS_SIZE - halfH, newY));
      return { ...s, x: newX, y: newY };
    }));
  };
  // Less sensitive rotation
  const handleStickerRotate = (id: string, startAngle: number, startRotation: number, mouseX: number, mouseY: number) => {
    setStickers(stickers => stickers.map(s => {
      if (s.id !== id) return s;
      const centerX = s.x;
      const centerY = s.y;
      const angle = Math.atan2(mouseY - centerY, mouseX - centerX) * 180 / Math.PI;
      return { ...s, rotation: startRotation + (angle - startAngle) * 0.5 }; // Slow down rotation
    }));
  };
  // Place sticker mode logic
  const handleStickerClick = (id: string) => {
    if (placingStickerId === id) {
      setPlacingStickerId(null); // Place sticker
    } else {
      setPlacingStickerId(id); // Activate sticker for moving
    }
  };
  // Remove sticker
  const removeSticker = (id: string) => {
    setStickers(stickers => stickers.filter(s => s.id !== id));
  };

  // Less sensitive resize
  const handleStickerResize = (id: string, scaleDelta: number) => {
    setStickers(stickers => stickers.map(s => s.id === id ? { ...s, scale: Math.max(0.2, s.scale * (1 + (scaleDelta - 1) * 0.2)) } : s));
  };

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h2 style={{ color: '#00ffff', textShadow: '1px 1px 0 #000', marginBottom: 8, fontSize: '16px' }}>Lawb Meme Maker</h2>
        <p className={classes.subtitle}>
          find memes or upload your own on{' '}
          <a href="https://memedepot.com/d/lawb" target="_blank" rel="noopener noreferrer" style={{ color: '#ff0000', textDecoration: 'underline' }}>
            Meme Depot
          </a>
        </p>
      </div>
      
    <div className={classes.content}>
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
            <span className={classes.label}>Size:</span>
            <input className={classes.input} type="number" min={10} max={100} value={topFontSize} onChange={e => setTopFontSize(Number(e.target.value))} style={{ width: 60, textAlign: 'center' }} />
          </div>
          <div className={classes.row}>
            <span className={classes.label}>Bottom Text:</span>
            <input className={classes.input} type="text" value={bottomText} onChange={e => setBottomText(e.target.value)} placeholder="Enter bottom text..." />
            <span className={classes.label}>Size:</span>
            <input className={classes.input} type="number" min={10} max={100} value={bottomFontSize} onChange={e => setBottomFontSize(Number(e.target.value))} style={{ width: 60, textAlign: 'center' }} />
          </div>
        </div>
        <div className={classes.section}>
          <div className={classes.sectionTitle}>Effects</div>
          <div className={classes.row}>
            <button className={classes.effectButton} style={{ background: deepFry ? '#00ffff' : undefined }} onClick={() => setDeepFry(v => !v)}>Deep Fry</button>
            <button className={classes.effectButton} style={{ background: pixelate ? '#00ffff' : undefined }} onClick={() => setPixelate(v => !v)}>Pixelate</button>
            <button className={classes.effectButton} style={{ background: grain ? '#00ffff' : undefined }} onClick={() => setGrain(v => !v)}>Grain</button>
          </div>
        </div>
        <div className={classes.section}>
          <div className={classes.sectionTitle}>Stickers</div>
          <div className={classes.row}>
            {STOCK_STICKERS.map((src, i) => (
              <img key={src} src={src} alt={`sticker${i+1}`} style={{ width: 32, height: 32, cursor: 'pointer', border: '1px solid #888', marginRight: 4 }} onClick={() => addSticker(src)} />
            ))}
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

      <div className={classes.memeArea}>
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className={classes.canvas} />
      </div>

      {/* Overlay stickers for manipulation */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: CANVAS_SIZE, height: CANVAS_SIZE, pointerEvents: 'none' }}>
        {stickers.map(sticker => (
          placingStickerId === sticker.id ? (
            <div
              key={sticker.id}
              style={{
                position: 'absolute',
                left: sticker.x,
                top: sticker.y,
                width: 80 * sticker.scale,
                height: 80 * sticker.scale,
                transform: `rotate(${sticker.rotation}deg)`,
                cursor: 'move',
                pointerEvents: 'auto',
                zIndex: 10,
                border: '2px solid #00f',
                boxShadow: '0 0 8px #00f',
              }}
              onMouseDown={e => {
                setActiveStickerId(sticker.id);
                e.stopPropagation();
              }}
              onMouseUp={() => setActiveStickerId(null)}
              onMouseMove={e => {
                if (activeStickerId === sticker.id && e.buttons === 1) {
                  handleStickerDrag(sticker.id, e.movementX, e.movementY);
                }
              }}
            >
              <img src={sticker.src} alt="sticker" style={{ width: '100%', height: '100%', userSelect: 'none', pointerEvents: 'none' }} draggable={false} />
              {/* Rotate handle */}
              <div style={{ position: 'absolute', right: -12, top: '40%', width: 16, height: 16, background: '#fff', borderRadius: '50%', border: '1px solid #888', cursor: 'grab', zIndex: 11 }}
                onMouseDown={e => {
                  e.stopPropagation();
                  const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                  const centerX = rect ? rect.left + rect.width / 2 : 0;
                  const centerY = rect ? rect.top + rect.height / 2 : 0;
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
              <div style={{ position: 'absolute', bottom: -12, right: -12, width: 16, height: 16, background: '#fff', borderRadius: '50%', border: '1px solid #888', cursor: 'nwse-resize', zIndex: 11 }}
                onMouseDown={e => {
                  e.stopPropagation();
                  const startX = e.clientX;
                  const onMove = (moveEvent: MouseEvent) => {
                    const delta = (moveEvent.clientX - startX) / 80;
                    handleStickerResize(sticker.id, 1 + delta);
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
              <button style={{ position: 'absolute', top: -12, left: -12, width: 16, height: 16, background: '#f00', color: '#fff', border: 'none', borderRadius: '50%', fontSize: 10, cursor: 'pointer', zIndex: 12 }} onClick={() => removeSticker(sticker.id)}>×</button>
              {/* Place sticker button */}
              <button style={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', width: 40, height: 18, background: '#0f0', color: '#000', border: '1px solid #888', borderRadius: 4, fontSize: 8, cursor: 'pointer', zIndex: 12 }} onClick={() => setPlacingStickerId(null)}>Place</button>
            </div>
          ) : null
        ))}
      </div>
    </div>
  );
}

export default MemeGenerator;