import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  popup: {
    position: 'absolute',
    background: '#c0c0c0',
    border: '2px outset #fff',
    width: '600px',
    height: '480px',
    minWidth: '360px',
    minHeight: '240px',
    top: 'calc(50vh - 240px)',
    left: 'calc(50vw - 300px)',
    display: ({ isOpen }: { isOpen: boolean }) => (isOpen ? 'block' : 'none'),
    resize: 'both',
    overflow: 'auto'
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
    userSelect: 'none'
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
    }
  },
  content: {
    padding: '15px',
    height: 'calc(100% - 30px)',
    overflow: 'auto'
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
  const nodeRef = useRef(null);

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize(id);
    }
  };

  return (
    <Draggable nodeRef={nodeRef} handle={`.${classes.header}`} defaultPosition={initialPosition}>
      <div ref={nodeRef} className={classes.popup} style={{ width: initialSize?.width, height: initialSize?.height, zIndex: zIndex || 100 }}>
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
      </div>
    </Draggable>
  );
}

export default Popup;