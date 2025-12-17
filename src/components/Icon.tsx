import React, { useRef } from 'react';
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable';
import { createUseStyles } from 'react-jss';
import { playIconClickSound } from '../utils/sound';
import { isBaseMiniApp } from '../utils/baseMiniapp';

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
  const nodeRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    playIconClickSound();
    onClick(action, popupId, url, folderId);
  };

  const handleDragStart = () => {
    if (position) {
      dragStartPos.current = { x: position.x, y: position.y };
      hasDragged.current = false;
    }
    // Clear any pending click timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
  };

  const handleDrag = (e: DraggableEvent, data: DraggableData) => {
    if (dragStartPos.current && position) {
      // Check if we actually moved (more than 5 pixels)
      const deltaX = Math.abs(data.x - dragStartPos.current.x);
      const deltaY = Math.abs(data.y - dragStartPos.current.y);
      if (deltaX > 5 || deltaY > 5) {
        hasDragged.current = true;
        // Clear click timeout if we're dragging
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }
      }
    }
    if (onDrag) {
      onDrag(e, data);
    }
  };

  const handleDragStop = () => {
    // If we didn't drag, treat it as a click (with small delay to ensure drag is complete)
    if (!hasDragged.current) {
      clickTimeoutRef.current = setTimeout(() => {
        console.log('[ICON] Click detected, calling onClick with:', { action, popupId, url, folderId });
        playIconClickSound();
        onClick(action, popupId, url, folderId);
        clickTimeoutRef.current = null;
      }, 50);
    } else {
      console.log('[ICON] Drag detected, skipping click');
    }
    hasDragged.current = false;
    dragStartPos.current = null;
  };
  
  const iconMarkup = (
    <div 
      ref={nodeRef}
      className={classes.icon}
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
    return (
      <div onClick={handleClick}>
        {iconMarkup}
      </div>
    );
  }

  // Disable dragging in Base Mini App
  const disableDragging = isBaseMiniApp();

  if (disableDragging) {
    return (
      <div onClick={handleClick}>
        {iconMarkup}
      </div>
    );
  }

  return (
    <Draggable 
      nodeRef={nodeRef} 
      position={position}
      onStart={handleDragStart}
      onDrag={handleDrag}
      onStop={handleDragStop}
      bounds="parent"
    >
      {iconMarkup}
    </Draggable>
  );
}

export default Icon;