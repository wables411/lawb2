import React, { useRef, useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { createUseStyles } from 'react-jss';
import { getSafeAreaInsets, isBaseMiniApp, isBaseMiniAppAsync } from '../utils/baseMiniapp';

const useStyles = createUseStyles({
  popup: {
    position: 'fixed',
    background: '#c0c0c0',
    border: '2px outset #fff',
    width: '600px',
    height: '480px',
    minWidth: '360px',
    minHeight: '240px',
    // Remove centering CSS - let react-draggable handle positioning
    display: ({ isOpen }: { isOpen: boolean; isBaseMiniApp?: boolean }) => (isOpen ? 'block' : 'none'),
    resize: 'both',
    overflow: 'auto',
    top: 0,
    left: 0,
    '@media (max-width: 768px)': {
      width: 'calc(100vw - 16px) !important',
      height: 'calc(100vh - 16px) !important',
      maxWidth: 'calc(100vw - 16px) !important',
      maxHeight: 'calc(100vh - 16px) !important',
      minWidth: '0 !important',
      minHeight: '0 !important',
      left: '8px !important',
      top: '8px !important',
      right: '8px !important',
      bottom: '8px !important',
      resize: 'none !important',
      boxSizing: 'border-box !important',
    },
    // Base Mini App should always use mobile styles regardless of window width
    '.base-miniapp &': {
      width: 'calc(100vw - 16px) !important',
      height: 'calc(100vh - 16px) !important',
      maxWidth: 'calc(100vw - 16px) !important',
      maxHeight: 'calc(100vh - 16px) !important',
      minWidth: '0 !important',
      minHeight: '0 !important',
      left: '8px !important',
      top: '8px !important',
      right: '8px !important',
      bottom: '8px !important',
      resize: 'none !important',
      boxSizing: 'border-box !important',
    }
  },
  header: {
    background: 'navy',
    color: '#fff',
    padding: '2px 4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => (isBaseMiniApp ? 'default' : 'move') as any,
    fontSize: '12px',
    fontWeight: 'bold',
    userSelect: 'none',
    minHeight: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => (isBaseMiniApp ? '24px' : 'auto') as any,
    '@media (max-width: 768px)': {
      padding: '4px 6px',
      fontSize: '12px',
      minHeight: '24px',
      cursor: 'default',
    },
    // Base Mini App should always use mobile header styles
    '.base-miniapp &': {
      padding: '4px 6px',
      fontSize: '12px',
      minHeight: '24px',
      cursor: 'default',
    }
  },
  titleBarButtons: {
    display: 'flex',
    gap: '1px'
  },
  titleBarButton: {
    width: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => (isBaseMiniApp ? '44px' : '16px') as any,
    height: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => (isBaseMiniApp ? '44px' : '14px') as any,
    minWidth: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => (isBaseMiniApp ? '44px' : '16px') as any,
    minHeight: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => (isBaseMiniApp ? '44px' : '14px') as any,
    border: '1px outset #c0c0c0',
    backgroundColor: '#c0c0c0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => (isBaseMiniApp ? '18px' : '8px') as any,
    color: 'black',
    padding: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => (isBaseMiniApp ? '12px' : '0') as any,
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    '&:active': {
      border: '1px inset #c0c0c0',
      backgroundColor: '#a0a0a0'
    },
    '@media (max-width: 768px)': {
      width: '44px',
      height: '44px',
      minWidth: '44px',
      minHeight: '44px',
      fontSize: '18px',
      padding: '12px',
    },
    // Base Mini App should always use mobile button styles
    '.base-miniapp &': {
      width: '44px',
      height: '44px',
      minWidth: '44px',
      minHeight: '44px',
      fontSize: '18px',
      padding: '12px',
    }
  },
  content: {
    padding: '15px',
    height: 'calc(100% - 30px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    background: 'transparent',
    boxSizing: 'border-box',
    maxWidth: '100%',
    width: '100%',
    wordWrap: 'break-word',
    wordBreak: 'break-word',
    hyphens: 'auto',
    '& img': {
      maxWidth: '100%',
      height: 'auto',
      display: 'block'
    },
    '& video': {
      maxWidth: '100%',
      height: 'auto',
      display: 'block'
    },
    '& *': {
      maxWidth: '100%',
      boxSizing: 'border-box'
    },
    '@media (max-width: 768px)': {
      padding: '16px',
      height: 'calc(100% - 50px)',
      fontSize: '16px',
      '-webkit-overflow-scrolling': 'touch',
    },
    // Base Mini App should always use mobile content styles
    '.base-miniapp &': {
      padding: '16px',
      height: 'calc(100% - 50px)',
      fontSize: '16px',
      '-webkit-overflow-scrolling': 'touch',
    }
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '20px',
    height: '20px',
    cursor: 'nwse-resize',
    background: 'transparent',
    zIndex: 10,
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.1)'
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: '2px',
      right: '2px',
      width: 0,
      height: 0,
      borderStyle: 'solid',
      borderWidth: '0 0 8px 8px',
      borderColor: 'transparent transparent rgba(0, 0, 0, 0.3) transparent'
    },
    '@media (max-width: 768px)': {
      display: 'none !important',
    },
    // Base Mini App should never show resize handle
    '.base-miniapp &': {
      display: 'none !important',
    }
  }
});

interface PopupProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: (id: string) => void;
  children: React.ReactNode;
  title?: string;
  initialPosition?: { x: number, y: number };
  initialSize?: { width: number | string, height: number | string };
  zIndex?: number;
}

function Popup({ id, isOpen, onClose, onMinimize, children, title, initialPosition, initialSize, zIndex }: PopupProps) {
  // Use the comprehensive Base Mini App detection from utils
  // This checks for iframe, SDK, hostname, referrer, user agent, etc.
  const [isBaseMiniAppDetected, setIsBaseMiniAppDetected] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  
  const classes = useStyles({ isOpen, isBaseMiniApp: isBaseMiniAppDetected });
  const nodeRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  
  // Detect Base Mini App using comprehensive detection (works on both mobile and desktop)
  useEffect(() => {
    const detectBaseMiniApp = async () => {
      // First try synchronous detection
      const syncDetected = isBaseMiniApp();
      if (syncDetected) {
        setIsBaseMiniAppDetected(true);
        // Get safe area insets
        try {
          const insets = await getSafeAreaInsets();
          setSafeAreaInsets(insets);
          console.log('[POPUP] Base Mini App detected (sync), safe area insets:', insets);
        } catch (error) {
          console.warn('[POPUP] Failed to get safe area insets:', error);
        }
        return;
      }
      
      // If sync detection failed, try async detection
      try {
        const asyncDetected = await isBaseMiniAppAsync();
        if (asyncDetected) {
          setIsBaseMiniAppDetected(true);
          // Get safe area insets
          try {
            const insets = await getSafeAreaInsets();
            setSafeAreaInsets(insets);
            console.log('[POPUP] Base Mini App detected (async), safe area insets:', insets);
          } catch (error) {
            console.warn('[POPUP] Failed to get safe area insets:', error);
          }
        } else {
          setIsBaseMiniAppDetected(false);
          console.log('[POPUP] Base Mini App not detected');
        }
      } catch (error) {
        console.warn('[POPUP] Error in async Base Mini App detection:', error);
        setIsBaseMiniAppDetected(false);
      }
    };
    
    void detectBaseMiniApp();
  }, []);
  
  // Debug: log when popup should be visible
  React.useEffect(() => {
    if (isOpen) {
      console.log(`[POPUP] ${id} is now OPEN`);
    } else {
      console.log(`[POPUP] ${id} is now CLOSED`);
    }
  }, [isOpen, id]);

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize(id);
    }
  };

  // Handle resize
  React.useEffect(() => {
    if (!resizeRef.current || !nodeRef.current) return;

    const resizeHandle = resizeRef.current;
    const popup = nodeRef.current;
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = popup.offsetWidth;
      startHeight = popup.offsetHeight;
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const width = startWidth + (e.clientX - startX);
      const height = startHeight + (e.clientY - startY);
      const minWidth = 360;
      const minHeight = 240;
      popup.style.width = `${Math.max(minWidth, width)}px`;
      popup.style.height = `${Math.max(minHeight, height)}px`;
    };

    const handleMouseUp = () => {
      isResizing = false;
    };

    resizeHandle.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      resizeHandle.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Use defaultPosition for initial placement - user can then drag freely
  const defaultPos = initialPosition || { x: 100, y: 100 };
  
  // Store position state to persist drag position
  const [position, setPosition] = React.useState(defaultPos);
  
  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  // Update position when initialPosition changes or when popup opens
  React.useEffect(() => {
    if (isOpen) {
      if (isBaseMiniAppDetected) {
        // Center popup in Base Mini App
        setPosition({ x: 0, y: 0 });
      } else if (initialPosition) {
        setPosition(initialPosition);
      } else {
        // Reset to default position when opening
        setPosition({ x: 100, y: 100 });
      }
    }
  }, [isOpen, initialPosition, isBaseMiniAppDetected]);
  
  const handleDrag = (e: any, data: any) => {
    setPosition({ x: data.x, y: data.y });
  };
  
  // Debug: log when popup renders
  React.useEffect(() => {
    if (isOpen && nodeRef.current) {
      console.log(`[POPUP] ${id} rendered, position:`, position, 'nodeRef:', nodeRef.current);
      console.log(`[POPUP] ${id} computed styles:`, window.getComputedStyle(nodeRef.current));
    }
  }, [isOpen, id, position]);

  // Render popup content (extracted for reuse)
  const renderPopupContent = () => {
    // For Base Mini App, use inline styles for header/buttons to avoid JSS conflicts
    if (isBaseMiniAppDetected) {
      return (
        <>
          <div style={{
            background: 'navy',
            color: '#fff',
            padding: '4px 6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'default',
            fontSize: '12px',
            fontWeight: 'bold',
            userSelect: 'none',
            minHeight: '24px',
          }}>
            <span>{title || id.replace('-popup', '')}</span>
            <div style={{ display: 'flex', gap: '1px' }}>
              <button
                onClick={handleMinimize}
                title="Minimize"
                style={{
                  width: '44px',
                  height: '44px',
                  minWidth: '44px',
                  minHeight: '44px',
                  border: '1px outset #c0c0c0',
                  backgroundColor: '#c0c0c0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: 'black',
                  padding: '12px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                _
              </button>
              <button
                onClick={onClose}
                title="Close"
                style={{
                  width: '44px',
                  height: '44px',
                  minWidth: '44px',
                  minHeight: '44px',
                  border: '1px outset #c0c0c0',
                  backgroundColor: '#c0c0c0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: 'black',
                  padding: '12px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                ×
              </button>
            </div>
          </div>
          <div style={{
            padding: '16px',
            height: 'calc(100% - 50px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            background: 'transparent',
            boxSizing: 'border-box',
            maxWidth: '100%',
            width: '100%',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            hyphens: 'auto',
            fontSize: '16px',
            WebkitOverflowScrolling: 'touch',
            position: 'relative', // Needed for absolutely positioned children
          }}>
            {children}
          </div>
        </>
      );
    }
    
    // Regular desktop rendering with JSS classes
    return (
      <>
        <div className={classes.header}>
          <span>{title || id.replace('-popup', '')}</span>
          <div className={classes.titleBarButtons}>
            <button
              className={classes.titleBarButton}
              onClick={handleMinimize}
              title="Minimize"
            >
              _
            </button>
            <button
              className={classes.titleBarButton}
              onClick={onClose}
              title="Close"
            >
              ×
            </button>
          </div>
        </div>
        <div className={classes.content}>
          {children}
        </div>
        <div className={classes.resizeHandle} />
      </>
    );
  };

  // For Base Mini App, don't use Draggable at all - render directly
  if (isBaseMiniAppDetected && isOpen) {
    // Calculate safe positioning for Base Mini App
    // Use actual safe area insets, or fallback to 0 if not loaded yet
    const topInset = safeAreaInsets.top || 0;
    const bottomInset = safeAreaInsets.bottom || 0;
    const leftInset = safeAreaInsets.left || 0;
    const rightInset = safeAreaInsets.right || 0;
    const taskbarHeight = 60;
    const padding = 8; // 8px padding on all sides
    
    // Base App has a header bar at the top (typically ~44-50px) that's not in safe area insets
    // Account for this header in addition to safe area insets
    const baseAppHeaderHeight = 50; // Base App header height
    
    // Total top space = safe area top + Base App header + padding
    const totalTopSpace = topInset + baseAppHeaderHeight + padding;
    // Total bottom space = safe area bottom + taskbar + padding
    const totalBottomSpace = bottomInset + taskbarHeight + padding;
    // Total left/right space = safe area + padding
    const totalLeftSpace = leftInset + padding;
    const totalRightSpace = rightInset + padding;
    
    // For Base Mini App, don't use the JSS class to avoid media query conflicts
    // Create inline styles that override everything
    return (
      <div 
        ref={nodeRef} 
        style={{ 
          // Base styles
          position: 'fixed',
          background: '#c0c0c0',
          border: '2px outset #fff',
          display: isOpen ? 'block' : 'none',
          boxSizing: 'border-box',
          zIndex: zIndex || 100,
          overflow: 'hidden',
          // Use inset to constrain all sides, ensuring popup never exceeds viewport
          // Top: safe area + Base App header + padding
          // Bottom: safe area + taskbar + padding
          // Left/Right: safe area + padding
          inset: `${totalTopSpace}px ${totalRightSpace}px ${totalBottomSpace}px ${totalLeftSpace}px`,
          width: 'auto',
          height: 'auto',
          maxWidth: 'none',
          maxHeight: 'none',
          minWidth: '0',
          minHeight: '0',
          resize: 'none',
          transform: 'none',
          margin: '0',
          padding: '0',
          // Force constraints to prevent overflow
          contain: 'layout style paint',
        }}
      >
        {renderPopupContent()}
      </div>
    );
  }

  // Desktop/regular browser path - Base Mini App should never reach here
  return (
    <Draggable 
      nodeRef={nodeRef} 
      handle={`.${classes.header}`} 
      defaultPosition={defaultPos}
      position={isOpen && !isBaseMiniAppDetected ? position : { x: 0, y: 0 }}
      onDrag={handleDrag}
      key={id}
      disabled={!isOpen || isMobile || isBaseMiniAppDetected}
    >
      <div 
        ref={nodeRef} 
        className={classes.popup}
        style={{ 
          width: initialSize?.width,
          height: initialSize?.height,
          zIndex: zIndex || 100
        }}
      >
        <div className={classes.header}>
          <span>{title || id.replace('-popup', '')}</span>
          <div className={classes.titleBarButtons}>
            <button
              className={classes.titleBarButton}
              onClick={handleMinimize}
              title="Minimize"
            >
              _
            </button>
            <button
              className={classes.titleBarButton}
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className={classes.content}>
          {children}
        </div>
        <div ref={resizeRef} className={classes.resizeHandle} title="Resize" />
      </div>
    </Draggable>
  );
}

export default Popup;