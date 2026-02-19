import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { createUseStyles } from 'react-jss';

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
    display: ({ isOpen }: { isOpen: boolean }) => (isOpen ? 'block' : 'none'),
    resize: 'both',
    overflow: 'auto',
    top: 0,
    left: 0,
    '@media (max-width: 768px)': {
      width: 'calc(100vw - 32px) !important',
      height: 'calc(100vh - 100px) !important', /* Account for navbar (50px) + safe areas */
      maxWidth: 'calc(100vw - 32px) !important',
      maxHeight: 'calc(100vh - 100px) !important',
      minWidth: '0 !important',
      minHeight: '200px !important', /* Minimum height for usability */
      left: '16px !important',
      top: 'calc(env(safe-area-inset-top, 0px) + 16px) !important', /* iOS safe area + spacing */
      right: '16px !important',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 50px + 16px) !important', /* Navbar + safe area + spacing */
      resize: 'none !important',
      boxSizing: 'border-box !important',
    },
  },
  header: {
    background: 'navy',
    color: '#fff',
    padding: '2px 4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'move',
    fontSize: '12px',
    fontWeight: 'bold',
    userSelect: 'none',
    '@media (max-width: 768px)': {
      padding: '4px 6px',
      fontSize: '12px',
      minHeight: '24px',
      cursor: 'default',
    },
  },
  titleBarButtons: {
    display: 'flex',
    gap: '1px'
  },
  titleBarButton: {
    width: '16px',
    height: '14px',
    minWidth: '16px',
    minHeight: '14px',
    border: '1px outset #c0c0c0',
    backgroundColor: '#c0c0c0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    color: 'black',
    padding: '0',
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
    // CRITICAL: Folder icons render inside Popups. The global wordBreak/hyphens above
    // can split single words like "Lawbsters" into "Lawbster" + "s".
    // Do NOT force whiteSpace here (Icon.tsx decides wrap/nowrap by label),
    // but do prevent mid-word breaking and hyphenation.
    '& .iconLabel, & [class*="iconLabel"]': {
      wordBreak: 'keep-all !important',
      overflowWrap: 'normal !important',
      wordWrap: 'normal !important',
      hyphens: 'none !important',
    },
    '& .piece-gallery, & .piece-gallery-compact, & .piece-gallery-list, & .piece-gallery-list-item, & .piece-gallery-list-content, & .piece-gallery-list-image-wrapper, & .piece-gallery-list-img, & .piece-gallery-list-info': {
      maxWidth: 'none',
      boxSizing: 'border-box'
    },
    '& .chess-chat-window': {
      maxWidth: 'none !important',
      boxSizing: 'border-box',
      position: 'relative !important',
      width: '100% !important',
      height: '100% !important',
      left: 'auto !important',
      top: 'auto !important',
      right: 'auto !important',
      bottom: 'auto !important',
      margin: '0 !important',
      padding: '0 !important',
      overflow: 'hidden !important',
    },
    '@media (max-width: 768px)': {
      padding: '16px',
      height: 'calc(100% - 50px)',
      fontSize: '16px',
      lineHeight: '1.5',
      '-webkit-overflow-scrolling': 'touch',
      '& p': {
        fontSize: '16px',
        lineHeight: '1.6',
        marginBottom: '12px',
      },
      '& h1, & h2, & h3, & h4': {
        fontSize: '20px',
        lineHeight: '1.4',
        marginBottom: '12px',
      },
      '& a': {
        fontSize: '16px',
        padding: '8px 12px',
        minHeight: '44px',
        display: 'inline-block',
        lineHeight: '28px',
        touchAction: 'manipulation',
      },
      '& button': {
        fontSize: '16px',
        padding: '12px 16px',
        minHeight: '44px',
        minWidth: '44px',
        touchAction: 'manipulation',
      },
      '& img, & video': {
        maxWidth: '100%',
        height: 'auto',
        marginTop: '12px',
        marginBottom: '12px',
      },
      '& iframe': {
        maxWidth: '100%',
        width: '100%',
        height: 'auto',
        minHeight: '200px',
      },
    },
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
  const classes = useStyles({ isOpen });
  const nodeRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

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
      // Don't force a "jump" to a larger minimum than the current size.
      // (Lawbamp starts small, but should still be resizable.)
      const minWidth = Math.min(360, startWidth);
      const minHeight = Math.min(240, startHeight);
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
      if (initialPosition) {
        setPosition(initialPosition);
      } else {
        // Reset to default position when opening
        setPosition({ x: 100, y: 100 });
      }
    }
  }, [isOpen, initialPosition]);
  
  const handleDrag = (e: any, data: any) => {
    setPosition({ x: data.x, y: data.y });
  };

  // Render popup content (extracted for reuse)
  const renderPopupContent = () => {
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
        <div ref={resizeRef} className={classes.resizeHandle} />
      </>
    );
  };

  // Desktop/regular browser path
  return (
    <Draggable 
      nodeRef={nodeRef} 
      handle={`.${classes.header}`} 
      defaultPosition={defaultPos}
      position={isOpen ? position : { x: 0, y: 0 }}
      onDrag={handleDrag}
      key={id}
      disabled={!isOpen || isMobile}
    >
      <div 
        ref={nodeRef} 
        id={id}
        data-popup-id={id}
        className={classes.popup}
        style={{ 
          width: initialSize?.width,
          height: initialSize?.height,
          zIndex: Math.min(zIndex || 100, 999998), // Ensure popups are always below navbar (999999)
          ...(isMobile && {
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
            left: '16px',
            right: '16px',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 50px + 16px)',
            width: 'calc(100vw - 32px)',
            height: 'calc(100vh - 100px)',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 100px)',
            margin: 0
          })
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