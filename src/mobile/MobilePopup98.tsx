import React from 'react';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100dvh',
    background: 'rgba(0,0,0,0.5)',
    zIndex: 1000000,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 'calc(env(safe-area-inset-top, 0px) + 8px) 8px calc(env(safe-area-inset-bottom, 0px) + 8px)',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  popup: {
    background: '#c0c0c0',
    border: '2px outset #fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 420,
    minHeight: 240,
    maxHeight: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  titleBar: {
    background: 'navy',
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: "'MS Sans Serif', Arial, sans-serif",
    fontSize: 16,
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '2px inset #fff',
    userSelect: 'none',
  },
  closeButton: {
    width: 28,
    height: 28,
    background: '#c0c0c0',
    border: '2px outset #fff',
    borderRadius: 4,
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginLeft: 8,
    boxShadow: '1px 1px 0 #888',
    '&:active': {
      border: '2px inset #fff',
      background: '#e0e0e0',
    },
  },
  content: {
    padding: '16px 16px calc(env(safe-area-inset-bottom, 0px) + 24px) 16px',
    overflowY: 'auto',
    overflowX: 'hidden',
    fontFamily: "'MS Sans Serif', Arial, sans-serif",
    color: '#000',
    fontSize: 15,
    background: '#fff',
    flex: 1,
    minHeight: 0,
  },
});

interface MobilePopup98Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const MobilePopup98: React.FC<MobilePopup98Props> = ({ isOpen, onClose, title, children }) => {
  const classes = useStyles();
  if (!isOpen) return null;
  return (
    <div className={classes.overlay}>
      <div className={classes.popup}>
        <div className={classes.titleBar}>
          <span>{title}</span>
          <button className={classes.closeButton} onClick={onClose} title="Close">✕</button>
        </div>
        <div className={classes.content}>{children}</div>
      </div>
    </div>
  );
};

export default MobilePopup98; 