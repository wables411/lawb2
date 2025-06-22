import React, { useRef } from 'react';
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable';
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
  folderId?: string;
  isInFolder?: boolean;
  position?: { x: number; y: number };
  onDrag?: (e: DraggableEvent, data: DraggableData) => void;
  onClick: (action: string, popupId?: string, url?: string, folderId?: string) => void;
}

function Icon({ image, label, action, url, popupId, folderId, isInFolder = false, position, onDrag, onClick }: IconProps) {
  const classes = useStyles();
  const nodeRef = useRef(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(action, popupId, url, folderId);
  };
  
  const iconMarkup = (
    <div 
      ref={nodeRef}
      className={classes.icon}
      onClick={handleClick}
      style={{ 
        position: isInFolder ? 'relative' : 'absolute',
        zIndex: 3000,
        left: !isInFolder && position ? position.x : undefined,
        top: !isInFolder && position ? position.y : undefined,
      }}
    >
      <img src={image} alt={label} className={classes.iconImage} />
      <span className={classes.iconLabel}>{label}</span>
    </div>
  );

  if (isInFolder) {
    return iconMarkup;
  }

  return (
    <Draggable 
      nodeRef={nodeRef} 
      position={position}
      onDrag={onDrag}
      bounds="parent"
    >
      {iconMarkup}
    </Draggable>
  );
}

export default Icon;