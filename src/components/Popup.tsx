import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  popup: {
    position: 'absolute',
    background: '#c0c0c0',
    border: '2px outset #fff',
    width: '480px',
    height: '360px',
    minWidth: '240px',
    minHeight: '180px',
    top: 'calc(50vh - 180px)',
    left: 'calc(50vw - 240px)',
    display: ({ isOpen }: { isOpen: boolean }) => (isOpen ? 'block' : 'none'),
    resize: 'both',
    overflow: 'auto',
    zIndex: 5000
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
}

function Popup({ id, isOpen, onClose, onMinimize, children }: PopupProps) {
  const classes = useStyles({ isOpen });
  const nodeRef = useRef(null);

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize(id);
    }
  };

  return (
    <Draggable nodeRef={nodeRef} handle={`.${classes.header}`}>
      <div ref={nodeRef} className={classes.popup}>
        <div className={classes.header}>
          <span>{id.replace('-popup', '')}</span>
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
        <div className={classes.content}>{children}</div>
      </div>
    </Draggable>
  );
}

export default Popup;