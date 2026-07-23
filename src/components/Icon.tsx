import { dlog } from '../utils/devLog';
import React, { useRef } from 'react';
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable';
import { createUseStyles } from 'react-jss';
import { playIconClickSound } from '../utils/sound';
import PretextLabel from './PretextLabel';

type StyleProps = { isBaseMiniApp: boolean; labelHasSpace: boolean };

const useStyles = createUseStyles({
  icon: {
    position: 'absolute',
    width: ({ isBaseMiniApp }: StyleProps) => isBaseMiniApp ? '80px' : '80px',
    minWidth: ({ isBaseMiniApp }: StyleProps) => isBaseMiniApp ? '80px' : '80px',
    minHeight: ({ isBaseMiniApp }: StyleProps) => isBaseMiniApp ? '80px' : '80px',
    textAlign: 'center',
    cursor: 'pointer',
    zIndex: 3000,
    userSelect: 'none',
    pointerEvents: 'auto',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    padding: ({ isBaseMiniApp }: StyleProps) => isBaseMiniApp ? '12px' : '8px',
    boxSizing: 'border-box'
  },
  iconImage: {
    width: ({ isBaseMiniApp }: StyleProps) => isBaseMiniApp ? '44px' : '48px',
    height: ({ isBaseMiniApp }: StyleProps) => isBaseMiniApp ? '44px' : '48px',
    minWidth: ({ isBaseMiniApp }: StyleProps) => isBaseMiniApp ? '44px' : '48px',
    minHeight: ({ isBaseMiniApp }: StyleProps) => isBaseMiniApp ? '44px' : '48px',
    display: 'block',
    margin: '0 auto',
    objectFit: 'contain'
  },
  iconLabel: {
    // Inline-block so the grey "badge" grows with text (prevents text spilling past background)
    display: 'inline-block',
    background: '#c0c0c0',
    color: '#000',
    fontSize: ({ isBaseMiniApp }: StyleProps) => isBaseMiniApp ? '10px' : '12px',
    padding: ({ isBaseMiniApp }: StyleProps) => isBaseMiniApp ? '2px 2px' : '2px 4px',
    marginTop: '2px',
    border: '1px outset #fff',
    textAlign: 'center',
    lineHeight: 1.2,
    maxWidth: ({ labelHasSpace }: StyleProps) => (labelHasSpace ? '96px' : 'none'),
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
  const classes = useStyles({ isBaseMiniApp: false, labelHasSpace: label.includes(' ') });
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
        dlog('[ICON] Click detected, calling onClick with:', { action, popupId, url, folderId });
        playIconClickSound();
        onClick(action, popupId, url, folderId);
        clickTimeoutRef.current = null;
      }, 50);
    } else {
      dlog('[ICON] Drag detected, skipping click');
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
        width: isInFolder ? 'auto' : undefined,
        minWidth: isInFolder ? '80px' : undefined,
        maxWidth: isInFolder ? 'none' : undefined,
      }}
    >
      <img src={image} alt={label} className={classes.iconImage} />
      <span className={classes.iconLabel}>
        <PretextLabel
          text={label}
          font={`${label.includes(' ') ? 12 : 12}px "MS Sans Serif", Arial, sans-serif`}
          maxWidth={label.includes(' ') ? 96 : 180}
          maxLines={label.includes(' ') ? 2 : 1}
          lineHeight={1.2}
        />
      </span>
    </div>
  );

  if (isInFolder) {
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