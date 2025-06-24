import React, { useRef, useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { getCollectionNFTs, getOpenSeaNFTs, getOpenSeaSolanaNFTs } from '../mint';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 16,
    background: '#c0c0c0',
    border: '2px outset #fff',
    borderRadius: 8,
    maxWidth: 500,
    width: '100%',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  header: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#000',
    fontSize: '11px',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 1.3,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 12,
    borderBottom: '1px solid #888',
    paddingBottom: 2,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  label: {
    minWidth: 80,
    color: '#000',
    fontWeight: 'bold',
    fontSize: 11,
  },
  input: {
    flex: 1,
    minWidth: 120,
    padding: '4px 6px',
    border: '2px inset #fff',
    background: '#fff',
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#000',
  },
  button: {
    padding: '6px 12px',
    background: '#c0c0c0',
    border: '2px outset #fff',
    cursor: 'pointer',
    fontSize: 11,
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
    padding: '4px 8px',
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
  memeArea: {
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 8,
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
    minWidth: 160,
    maxHeight: 200,
    overflowY: 'auto',
  },
  dropdownItem: {
    padding: '6px 8px',
    cursor: 'pointer',
    fontSize: 11,
    borderBottom: '1px solid #eee',
    '&:hover': {
      background: '#f0f0f0',
    },
  },
  actions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
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

  // Basic drawing functionality
  const drawMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

      const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image if available
    if (nftImage) {
      console.log('Loading image:', nftImage);
        const img = new Image();
      img.crossOrigin = 'anonymous'; // Try to fix CORS issue
      
        img.onload = () => {
        console.log('Image loaded successfully:', img.width, 'x', img.height);
        // Check if canvas still exists and is the same one
        const currentCanvas = canvasRef.current;
        if (!currentCanvas || currentCanvas !== canvas) return;
        
        const currentCtx = currentCanvas.getContext('2d');
        if (!currentCtx) return;
        
        // Clear and redraw everything
        currentCtx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
        
        // Calculate aspect ratio to fit image properly
        const scale = Math.min(currentCanvas.width / img.width, currentCanvas.height / img.height);
        const x = (currentCanvas.width - img.width * scale) / 2;
        const y = (currentCanvas.height - img.height * scale) / 2;
        
        console.log('Drawing image at:', x, y, 'with scale:', scale);
        currentCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
        drawText(currentCtx);
        
        // Apply effects after drawing everything
        applyEffectsSafely(currentCanvas);
      };
      
      img.onerror = (error) => {
        console.error('Failed to load image:', nftImage, error);
        // Check if canvas still exists and is the same one
        const currentCanvas = canvasRef.current;
        if (!currentCanvas || currentCanvas !== canvas) return;
        
        const currentCtx = currentCanvas.getContext('2d');
        if (!currentCtx) return;
        
        // Clear and draw placeholder background
        currentCtx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
        currentCtx.fillStyle = '#333';
        currentCtx.fillRect(0, 0, currentCanvas.width, currentCanvas.height);
        drawText(currentCtx);
        
        // Apply effects to placeholder
        applyEffectsSafely(currentCanvas);
      };
      
      img.src = nftImage;
    } else {
      // Draw placeholder background
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawText(ctx);
      
      // Apply effects after drawing everything
      applyEffectsSafely(canvas);
    }
  };

  const drawText = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    ctx.textAlign = 'center';
    
    // Function to wrap text
    const wrapText = (text: string, maxWidth: number) => {
      const words = text.split(' ');
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
    
    // Draw top text
    if (topText) {
      ctx.font = `bold ${topFontSize}px Impact`;
      const maxWidth = canvas.width * 0.9; // Leave 10% margin on each side
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
      const maxWidth = canvas.width * 0.9; // Leave 10% margin on each side
      const lines = wrapText(bottomText, maxWidth);
      
      // Calculate total height of bottom text
      const totalHeight = lines.length * bottomFontSize * 1.2;
      const startY = canvas.height - totalHeight - 10;
      
      lines.forEach((line, index) => {
        const y = startY + (index * bottomFontSize * 1.2);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(line, canvas.width / 2, y);
        ctx.fillStyle = '#fff';
        ctx.fillText(line, canvas.width / 2, y);
      });
    }
  };

  // Safely apply effects with CORS error handling
  const applyEffectsSafely = (canvas: HTMLCanvasElement) => {
    try {
      if (deepFry) applyDeepFry(canvas);
      if (pixelate) applyPixelate(canvas);
      if (grain) applyGrain(canvas);
    } catch (error) {
      console.warn('Effects could not be applied due to CORS restrictions. Try uploading your own image instead.');
      // Reset effect states to prevent confusion
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
    drawMeme();
  }, [topText, bottomText, topFontSize, bottomFontSize, nftImage, deepFry, pixelate, grain]);

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
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary link to download the canvas
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
        <div className={classes.actions}>
          <button className={classes.button} onClick={handleSave}>Save Image</button>
          <button className={classes.button} onClick={handleRestart}>Restart</button>
        </div>
      </div>

      <div className={classes.memeArea}>
        <canvas ref={canvasRef} width={400} height={400} className={classes.canvas} />
      </div>
    </div>
  );
}

export default MemeGenerator;