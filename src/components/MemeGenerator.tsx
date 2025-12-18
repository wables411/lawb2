import React, { useRef, useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { getCollectionNFTs, getOpenSeaNFTs, getOpenSeaSolanaNFTs } from '../mint';
import { v4 as uuidv4 } from 'uuid';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    flexDirection: 'row',
    gap: 0,
    padding: 0,
    background: 'linear-gradient(180deg, #c0c0c0 0%, #808080 100%)', // Winamp metallic gradient
    border: '2px outset #c0c0c0',
    borderRadius: 0,
    maxWidth: '100%',
    width: '100%',
    fontFamily: 'MS Sans Serif, Arial, sans-serif',
    fontSize: 11,
    boxSizing: 'border-box',
    height: '100%',
    overflow: 'hidden',
    boxShadow: 'inset 1px 1px 0 #fff, inset -1px -1px 0 #000',
    // Theme-aware styling
    '.lawb-app-dark-mode &': {
      background: '#000000 !important',
      borderColor: '#00ff00 !important',
      color: '#00ff00 !important',
    },
    '.lawb-app-light-mode &': {
      background: 'linear-gradient(180deg, #c0c0c0 0%, #808080 100%)',
    },
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
    // Base Mini App optimization
    ...(typeof window !== 'undefined' && (() => {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    })() ? {
      flexDirection: 'column',
      height: '100%',
      overflow: 'auto',
    } : {}),
  },
  // Dark mode styles
  header: {
    textAlign: 'center',
    marginBottom: 6,
    padding: '4px',
    background: 'linear-gradient(180deg, #000080 0%, #000060 100%)',
    border: '1px inset #000',
    color: '#fff',
  },
  subtitle: {
    color: '#fff',
    fontSize: '8px',
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: 1.2,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flexShrink: 0,
    width: '220px',
    minWidth: '200px',
    maxHeight: '100%',
    overflowY: 'auto',
    padding: '8px',
    background: 'linear-gradient(180deg, #e0e0e0 0%, #c0c0c0 100%)',
    borderRight: '2px inset #808080',
    boxShadow: 'inset 1px 1px 0 #fff',
    '@media (max-width: 768px)': {
      width: '100%',
      minWidth: 'auto',
      maxHeight: '45%',
      borderRight: 'none',
      borderBottom: '2px inset #808080',
    },
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    marginBottom: 6,
    padding: '4px',
    background: 'linear-gradient(180deg, #f0f0f0 0%, #e0e0e0 100%)',
    border: '1px inset #808080',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 10,
    borderBottom: '1px solid #808080',
    paddingBottom: 2,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginBottom: 2,
  },
  label: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 9,
    marginBottom: 2,
  },
  input: {
    width: '100%',
    padding: '3px 4px',
    border: '2px inset #808080',
    background: '#fff',
    fontSize: 9,
    fontFamily: 'MS Sans Serif, Arial, sans-serif',
    color: '#000',
    textTransform: 'uppercase',
    boxSizing: 'border-box',
  },
  button: {
    padding: '4px 8px',
    background: 'linear-gradient(180deg, #e0e0e0 0%, #c0c0c0 100%)',
    border: '2px outset #c0c0c0',
    cursor: 'pointer',
    fontSize: 9,
    fontWeight: 'normal',
    color: '#000',
    borderRadius: 0,
    width: '100%',
    fontFamily: 'MS Sans Serif, Arial, sans-serif',
    textAlign: 'center',
    '&:hover': {
      background: 'linear-gradient(180deg, #f0f0f0 0%, #e0e0e0 100%)',
    },
    '&:active': {
      border: '2px inset #808080',
      background: 'linear-gradient(180deg, #c0c0c0 0%, #a0a0a0 100%)',
    },
  },
  effectButton: {
    padding: '3px 6px',
    background: 'linear-gradient(180deg, #e0e0e0 0%, #c0c0c0 100%)',
    border: '2px outset #c0c0c0',
    cursor: 'pointer',
    fontSize: 8,
    fontWeight: 'normal',
    color: '#000',
    borderRadius: 0,
    flex: 1,
    fontFamily: 'MS Sans Serif, Arial, sans-serif',
    '&:hover': {
      background: 'linear-gradient(180deg, #f0f0f0 0%, #e0e0e0 100%)',
    },
    '&:active': {
      border: '2px inset #808080',
      background: 'linear-gradient(180deg, #c0c0c0 0%, #a0a0a0 100%)',
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
    // Background will be overridden by dark mode CSS
    backgroundImage: 'url("/assets/background.gif")',
    backgroundRepeat: 'repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '2px inset #808080',
    borderRadius: 0,
    padding: '12px',
    boxShadow: 'inset 1px 1px 0 #000',
  },
  canvas: {
    border: '2px inset #000',
    background: '#000',
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.8)',
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
  { id: 'asciilawbs', name: 'ASCII Lawbsters', api: 'opensea', slug: 'asciilawbs', chain: 'base' },
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
          const availableWidth = memeArea.clientWidth - 24; // padding (12px * 2)
          const availableHeight = memeArea.clientHeight - 24; // padding (12px * 2)
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
    
    // Watch for layout changes (especially important for mobile)
    const memeArea = containerRef.current?.querySelector('[class*="memeArea"]') as HTMLElement;
    let resizeObserver: ResizeObserver | null = null;
    if (memeArea && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateCanvasSize();
      });
      resizeObserver.observe(memeArea);
    }
    
    window.addEventListener('resize', updateCanvasSize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateCanvasSize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // drawText and applyEffectsSafely moved inside drawMeme
  const drawMemeToCanvas = async (canvas: HTMLCanvasElement, scaleFactor: number = 1, baseCanvasSize: number = canvasSize) => {
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
      // Placeholder canvas when no image selected
      ctx.fillStyle = '#8b0000'; // dark red
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const message = 'ADD IMAGE OR SELECT RANDOM LAWB FROM COLLECTIONS';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 4;
      ctx.fillStyle = 'white';

      const fontSize = Math.max(18, Math.floor(canvas.width * 0.06));
      ctx.font = `${fontSize}px Impact`;

      const maxWidth = canvas.width - 40;
      const words = message.split(' ');
      const lines: string[] = [];
      let currentLine = words[0] || '';

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = `${currentLine} ${word}`;
        const width = ctx.measureText(testLine).width;
        if (width < maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);

      const totalHeight = lines.length * fontSize * 1.2;
      const startY = (canvas.height - totalHeight) / 2 + fontSize;

      lines.forEach((line, index) => {
        const y = startY + index * fontSize * 1.2;
        ctx.strokeText(line, canvas.width / 2, y);
        ctx.fillText(line, canvas.width / 2, y);
      });

      // No image yet, so we don't draw top/bottom text or stickers
      return;
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
        let currentLine = words[0] || '';
        
        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const testLine = `${currentLine} ${word}`.trim();
          const width = ctx.measureText(testLine).width;
          if (width < maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };
      
      // Top text - constrained to image (canvas)
      if (topText) {
        // Calculate font size based on BASE canvas size (display canvas), then scale for target canvas
        const baseScaledFontSize = Math.min(topFontSize, baseCanvasSize * 0.15);
        const scaledFontSize = baseScaledFontSize * scaleFactor;
        ctx.font = `${scaledFontSize}px Impact`;
        const maxWidth = canvas.width - (20 * scaleFactor); // Padding from edges, scaled
        const lines = wrapText(topText, maxWidth);
        lines.forEach((line, index) => {
          const y = (scaledFontSize + (index * scaledFontSize * 1.2));
          // Ensure text stays within canvas bounds
          if (y <= canvas.height - (10 * scaleFactor)) { // Leave space for bottom text
            ctx.strokeText(line, canvas.width / 2, y);
            ctx.fillText(line, canvas.width / 2, y);
          }
        });
      }
      
      // Bottom text - constrained to image (canvas)
      if (bottomText) {
        // Calculate font size based on BASE canvas size (display canvas), then scale for target canvas
        const baseScaledFontSize = Math.min(bottomFontSize, baseCanvasSize * 0.15);
        const scaledFontSize = baseScaledFontSize * scaleFactor;
        ctx.font = `${scaledFontSize}px Impact`;
        const maxWidth = canvas.width - (20 * scaleFactor); // Padding from edges, scaled
        const lines = wrapText(bottomText, maxWidth);
        lines.forEach((line, index) => {
          const y = canvas.height - (lines.length - index) * scaledFontSize * 1.2 + scaledFontSize; // Position from bottom edge
          // Ensure text stays within canvas bounds
          if (y >= 10 * scaleFactor) { // Leave space for top text
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
        const stickerSize = 80 * sticker.scale * scaleFactor;
        ctx.save();
        ctx.translate(sticker.x * scaleFactor, sticker.y * scaleFactor);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.scale(sticker.scale * scaleFactor, sticker.scale * scaleFactor);
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
    // Check if touch is on a sticker - if so, don't prevent default
    const target = e.target as HTMLElement;
    if (target.closest('[data-sticker-overlay]')) {
      return; // Let sticker handle the touch
    }
    
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

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    // Check if touch is on a sticker - if so, don't clear timer
    const target = e.target as HTMLElement;
    if (target.closest('[data-sticker-overlay]')) {
      return; // Let sticker handle the touch
    }
    
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
    
    // Create a high-resolution canvas for saving (1080x1080)
    const SAVE_RESOLUTION = 1080;
    const saveCanvas = document.createElement('canvas');
    saveCanvas.width = SAVE_RESOLUTION;
    saveCanvas.height = SAVE_RESOLUTION;
    
    // Calculate scale factor: save canvas size / display canvas size
    const scaleFactor = SAVE_RESOLUTION / canvasSize;
    
    // Draw the meme to the high-res canvas with proper scaling
    // Pass baseCanvasSize so font size is calculated from display canvas, not save canvas
    await drawMemeToCanvas(saveCanvas, scaleFactor, canvasSize);
    
    // Save the high-resolution image
    const link = document.createElement('a');
    link.download = 'meme.png';
    link.href = saveCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMemeBlob = async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const SAVE_RESOLUTION = 1080;
    const saveCanvas = document.createElement('canvas');
    saveCanvas.width = SAVE_RESOLUTION;
    saveCanvas.height = SAVE_RESOLUTION;
    
    // Calculate scale factor: save canvas size / display canvas size
    const scaleFactor = SAVE_RESOLUTION / canvasSize;
    
    // Pass baseCanvasSize so font size is calculated from display canvas, not save canvas
    await drawMemeToCanvas(saveCanvas, scaleFactor, canvasSize);
    
    return new Promise((resolve) => {
      saveCanvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  };

  const handleShare = async (platform: 'x' | 'telegram' | 'base' | 'farcaster') => {
    const blob = await getMemeBlob();
    if (!blob) return;
    
    const shareText = 'there is no meme i lawb you';
    const file = new File([blob], 'meme.png', { type: 'image/png' });
    const imageUrl = URL.createObjectURL(blob);
    const nav: any = navigator;

    // Best case: native share with image (mainly mobile)
    if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await nav.share({
          title: 'Lawb Meme',
          text: shareText,
          files: [file],
        });
        URL.revokeObjectURL(imageUrl);
        return;
      } catch {
        // fall through to web fallbacks
      }
    }

    // Helper: copy text and open image in new tab
    const prepareClipboardAndImage = async () => {
      try {
        if (navigator.clipboard && (navigator.clipboard as any).writeText) {
          await navigator.clipboard.writeText(shareText);
        }
      } catch {
        // ignore clipboard errors
      }
      window.open(imageUrl, '_blank');
    };
    
    let url = '';
    
    switch (platform) {
      case 'x':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        await prepareClipboardAndImage();
        window.open(url, '_blank', 'width=550,height=420');
        alert('Text copied to clipboard and image opened in a new tab. Attach the image in the X composer.');
        break;
        
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;
        await prepareClipboardAndImage();
        window.open(url, '_blank');
        alert('Text copied to clipboard and image opened in a new tab. Attach the image in Telegram.');
        break;
        
      case 'base':
        await prepareClipboardAndImage();
        url = 'https://www.base.org/';
        window.open(url, '_blank');
        alert('Text copied to clipboard and image opened in a new tab. Post it from your Base-connected app.');
        break;
        
      case 'farcaster':
        await prepareClipboardAndImage();
        url = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
        alert('Text copied to clipboard and image opened in a new tab. Attach the image in Farcaster.');
        break;
    }

    URL.revokeObjectURL(imageUrl);
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
    // Center the sticker on the canvas
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const newSticker = {
      id: uuidv4(),
      src,
      x: centerX,
      y: centerY,
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
    // Auto-activate the sticker so it's immediately draggable
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
    <div className={classes.container} ref={containerRef} style={{ height: '100%' }}>
      <div className={classes.content}>
        <div className={classes.header}>
          <h2 style={{ color: '#fff', marginBottom: 2, fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>LAWB MEME MAKER</h2>
          <p className={classes.subtitle}>
            <a href="https://memedepot.com/d/lawb" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>
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
            <label className={classes.button} style={{ marginBottom: 0, width: 'auto', alignSelf: 'flex-start', padding: '2px 6px' }}>
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
            <button className={classes.effectButton} style={{ background: deepFry ? 'linear-gradient(180deg, #000080 0%, #000060 100%)' : undefined, color: deepFry ? '#fff' : undefined }} onClick={() => setDeepFry(v => !v)}>Deep Fry</button>
            <button className={classes.effectButton} style={{ background: pixelate ? 'linear-gradient(180deg, #000080 0%, #000060 100%)' : undefined, color: pixelate ? '#fff' : undefined }} onClick={() => setPixelate(v => !v)}>Pixelate</button>
            <button className={classes.effectButton} style={{ background: grain ? 'linear-gradient(180deg, #000080 0%, #000060 100%)' : undefined, color: grain ? '#fff' : undefined }} onClick={() => setGrain(v => !v)}>Grain</button>
          </div>
        </div>
        <div className={classes.section}>
          <div className={classes.sectionTitle}>Stickers</div>
          <div className={classes.row}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginBottom: 4 }}>
              {STOCK_STICKERS.map((src, i) => (
                <img key={src} src={src} alt={`sticker${i+1}`} style={{ width: '100%', aspectRatio: '1', cursor: 'pointer', border: '1px inset #808080', borderRadius: 0 }} onClick={() => addSticker(src)} />
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
        <div className={classes.section}>
          <div className={classes.sectionTitle}>Share</div>
          <div className={classes.row} style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
            <button className={classes.button} onClick={() => handleShare('x')} style={{ flex: '1 1 45%', minWidth: '90px' }}>X.com</button>
            <button className={classes.button} onClick={() => handleShare('telegram')} style={{ flex: '1 1 45%', minWidth: '90px' }}>Telegram</button>
            <button className={classes.button} onClick={() => handleShare('base')} style={{ flex: '1 1 45%', minWidth: '90px' }}>Base</button>
            <button className={classes.button} onClick={() => handleShare('farcaster')} style={{ flex: '1 1 45%', minWidth: '90px' }}>Farcaster</button>
          </div>
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
              data-sticker-overlay
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
                touchAction: 'none',
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
              onTouchStart={e => {
                e.stopPropagation();
                if (placingStickerId === sticker.id) {
                  const touch = e.touches[0];
                  setActiveStickerId(sticker.id);
                  const rect = canvasRef.current!.getBoundingClientRect();
                  const startCanvasX = sticker.x;
                  const startCanvasY = sticker.y;
                  const startTouchX = touch.clientX;
                  const startTouchY = touch.clientY;
                  const onMove = (moveEvent: TouchEvent) => {
                    if (moveEvent.touches.length === 0) return;
                    const touch = moveEvent.touches[0];
                    const scaleX = canvasSize / rect.width;
                    const scaleY = canvasSize / rect.height;
                    const deltaX = (touch.clientX - startTouchX) * scaleX;
                    const deltaY = (touch.clientY - startTouchY) * scaleY;
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
                  const onEnd = () => {
                    window.removeEventListener('touchmove', onMove);
                    window.removeEventListener('touchend', onEnd);
                    setActiveStickerId(null);
                  };
                  window.addEventListener('touchmove', onMove, { passive: false });
                  window.addEventListener('touchend', onEnd);
                } else {
                  // Activate sticker on first touch
                  handleStickerClick(sticker.id);
                }
              }}
            >
              <img src={sticker.src} alt="sticker" style={{ width: '100%', height: '100%', userSelect: 'none', pointerEvents: 'none' }} draggable={false} />
              {placingStickerId === sticker.id && (
                <>
                  {/* Rotate handle */}
                  <div style={{ position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', background: '#c4cfa1', borderRadius: '50%', border: '2px solid #0f380f', cursor: 'grab', zIndex: 11, touchAction: 'none' }}
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
                    onTouchStart={e => {
                      e.stopPropagation();
                      const touch = e.touches[0];
                      const rect = canvasRef.current!.getBoundingClientRect();
                      const centerX = rect.left + rect.width * (sticker.x / canvasSize);
                      const centerY = rect.top + rect.height * (sticker.y / canvasSize);
                      const startAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * 180 / Math.PI;
                      const startRotation = sticker.rotation;
                      const onMove = (moveEvent: TouchEvent) => {
                        if (moveEvent.touches.length === 0) return;
                        const touch = moveEvent.touches[0];
                        handleStickerRotate(sticker.id, startAngle, startRotation, touch.clientX, touch.clientY);
                      };
                      const onEnd = () => {
                        window.removeEventListener('touchmove', onMove);
                        window.removeEventListener('touchend', onEnd);
                      };
                      window.addEventListener('touchmove', onMove, { passive: false });
                      window.addEventListener('touchend', onEnd);
                    }}
                  />
                  {/* Resize handle */}
                  <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '20px', height: '20px', background: '#c4cfa1', borderRadius: '50%', border: '2px solid #0f380f', cursor: 'nwse-resize', zIndex: 11, touchAction: 'none' }}
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
                    onTouchStart={e => {
                      e.stopPropagation();
                      const touch = e.touches[0];
                      const startX = touch.clientX;
                      const startScale = sticker.scale;
                      const onMove = (moveEvent: TouchEvent) => {
                        if (moveEvent.touches.length === 0) return;
                        const touch = moveEvent.touches[0];
                        handleStickerResize(sticker.id, touch.clientX, startX, startScale);
                      };
                      const onEnd = () => {
                        window.removeEventListener('touchmove', onMove);
                        window.removeEventListener('touchend', onEnd);
                      };
                      window.addEventListener('touchmove', onMove, { passive: false });
                      window.addEventListener('touchend', onEnd);
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