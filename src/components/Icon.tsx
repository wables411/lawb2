import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  icon: {
    position: 'absolute',
    width: '80px',
    textAlign: 'center',
    cursor: 'pointer',
    zIndex: 3000,
    userSelect: 'none',
    pointerEvents: 'auto'
  },
  iconImage: {
    width: '48px',
    height: '48px',
    display: 'block',
    margin: '0 auto'
  },
  iconLabel: {
    display: 'block',
    background: '#c0c0c0',
    color: '#000',
    fontSize: '12px',
    padding: '2px 4px',
    marginTop: '2px',
    border: '1px outset #fff'
  }
});

interface IconProps {
  image: string;
  label: string;
  action: string;
  url?: string;
  popupId?: string;
  top: number;
  left: number;
  onClick: (action: string, popupId?: string, url?: string) => void;
}

function Icon({ image, label, action, url, popupId, top, left, onClick }: IconProps) {
  const classes = useStyles();
  const nodeRef = useRef(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(action, popupId, url);
  };

  return (
    <Draggable 
      nodeRef={nodeRef} 
      defaultPosition={{ x: left, y: top }}
      bounds="parent"
      position={undefined}
    >
      <div 
        ref={nodeRef}
        className={classes.icon}
        onClick={handleClick}
        style={{ 
          zIndex: 3000,
          position: 'absolute',
          left: left,
          top: top
        }}
      >
        <img src={image} alt={label} className={classes.iconImage} />
        <span className={classes.iconLabel}>{label}</span>
      </div>
    </Draggable>
  );
}

export default Icon;