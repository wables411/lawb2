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
    cursor: 'move',
    fontSize: '12px',
    fontWeight: 'bold',
    userSelect: 'none',
    '@media (max-width: 768px)': {
      padding: '12px 16px',
      fontSize: '16px',
      minHeight: '50px',
      cursor: 'default',
    }
  },
  titleBarButtons: {
    display: 'flex',
    gap: '1px'
  },
  titleBarButton: {
    width: '16px',
    height: '14px',
    border: '1px outset #c0c0c0',
    backgroundColor: '#c0c0c0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    color: 'black',
    '&:active': {
      border: '1px inset #c0c0c0'
    },
    '@media (max-width: 768px)': {
      width: '44px',
      height: '44px',
      fontSize: '18px',
      minWidth: '44px',
      minHeight: '44px',
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
  const classes = useStyles({ isOpen });
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
  
  // Debug: log when popup renders
  React.useEffect(() => {
    if (isOpen && nodeRef.current) {
      console.log(`[POPUP] ${id} rendered, position:`, position, 'nodeRef:', nodeRef.current);
      console.log(`[POPUP] ${id} computed styles:`, window.getComputedStyle(nodeRef.current));
    }
  }, [isOpen, id, position]);

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  return (
    <Draggable 
      nodeRef={nodeRef} 
      handle={`.${classes.header}`} 
      defaultPosition={defaultPos}
      position={isOpen ? position : undefined}
      onDrag={handleDrag}
      key={id}
      disabled={!isOpen || isMobile}
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