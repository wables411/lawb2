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
    }
  },
  titleBarButtons: {
    display: 'flex',
    gap: '1px'
  },
  titleBarButton: {
    width: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => (isBaseMiniApp ? '14px' : '16px') as any,
    height: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => (isBaseMiniApp ? '12px' : '14px') as any,
    border: '1px outset #c0c0c0',
    backgroundColor: '#c0c0c0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: ({ isBaseMiniApp }: { isBaseMiniApp?: boolean }) => (isBaseMiniApp ? '7px' : '8px') as any,
    color: 'black',
    padding: '0',
    '&:active': {
      border: '1px inset #c0c0c0'
    },
    '@media (max-width: 768px)': {
      width: '14px',
      height: '12px',
      fontSize: '7px',
      minWidth: '14px',
      minHeight: '12px',
    }
  },
  content: {
    padding: '15px',
    height: 'calc(100% - 30px)',
    overflow: 'auto',
    background: 'transparent',
    '@media (max-width: 768px)': {
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
  // Detect Base Mini App (iframe)
  const isBaseMiniAppDetected = typeof window !== 'undefined' && (() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true; // Cross-origin iframe = Base Mini App
    }
  })();
  
  const classes = useStyles({ isOpen, isBaseMiniApp: isBaseMiniAppDetected });
  const nodeRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  
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
  const renderPopupContent = () => (
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
      {!isBaseMiniAppDetected && (
        <div className={classes.resizeHandle} />
      )}
    </>
  );

  // For Base Mini App, don't use Draggable at all - render directly
  if (isBaseMiniAppDetected && isOpen) {
    return (
      <div 
        ref={nodeRef} 
        className={classes.popup}
        style={{ 
          width: 'calc(100vw - 32px)',
          height: 'calc(100vh - 60px)',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 60px)',
          minWidth: '0',
          minHeight: '0',
          left: '50%',
          top: '50%',
          right: 'auto',
          bottom: 'auto',
          resize: 'none',
          boxSizing: 'border-box',
          position: 'fixed',
          transform: 'translate(-50%, -50%) !important',
          margin: '0',
          zIndex: zIndex || 100
        }}
      >
        {renderPopupContent()}
      </div>
    );
  }

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
          ...(isBaseMiniAppDetected ? {
            width: 'calc(100vw - 32px)',
            height: 'calc(100vh - 60px)',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 60px)',
            minWidth: '0',
            minHeight: '0',
            left: '50%',
            top: '50%',
            right: 'auto',
            bottom: 'auto',
            resize: 'none',
            boxSizing: 'border-box',
            position: 'fixed',
            transform: 'translate(-50%, -50%)',
            margin: '0',
            inset: 'auto'
          } : {
            width: initialSize?.width,
            height: initialSize?.height
          }),
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