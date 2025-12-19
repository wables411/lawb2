import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { database } from '../firebaseApp';
import { ref, push, onValue, set, query, orderByChild, limitToLast, get } from 'firebase/database';
import { getDisplayName as getDisplayNameUtil } from '../utils/displayName';
import { firebaseProfiles } from '../firebaseProfiles';
// Removed blocking connection test - loading data directly with timeout
import './ChessChat.css';

interface ChatMessage {
  id: string;
  userId: string;
  walletAddress: string;
  displayName: string;
  message: string;
  timestamp: number;
  room: 'public' | 'private';
  inviteCode?: string;
}

interface ChessChatProps {
  isOpen: boolean;
  onMinimize: () => void;
  currentInviteCode?: string;
  isDraggable?: boolean;
  isResizable?: boolean;
  isMobile?: boolean;
}

export const ChessChat: React.FC<ChessChatProps> = ({
  isOpen,
  onMinimize,
  currentInviteCode,
  isDraggable = true,
  isResizable = true,
  isMobile = false
}) => {
  const { address: walletAddress, isConnected } = useAccount();
  
  // Detect Base Mini App (iframe)
  const isBaseMiniApp = typeof window !== 'undefined' && (() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true; // Cross-origin iframe = Base Mini App
    }
  })();
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentRoom, setCurrentRoom] = useState<'public' | 'private'>('public');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [displayNameMap, setDisplayNameMap] = useState<Record<string, string>>({});
  const [profilePictureMap, setProfilePictureMap] = useState<Record<string, string>>({});
  
  // Draggable/Resizable state
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 400, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Refs
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchedAddressesRef = useRef<Set<string>>(new Set());
  
  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Get display name for current user
  const getDisplayName = async () => {
    if (!walletAddress) return 'Anonymous';
    try {
      return await getDisplayNameUtil(walletAddress);
    } catch (error) {
      console.error('Error getting display name:', error);
      return formatAddress(walletAddress);
    }
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Store unsubscribe function for cleanup
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Load messages from Firebase
  const loadMessages = useCallback(async () => {
    if (!isOpen) {
      return;
    }
    
    // Check if database is available
    if (!database) {
      setError('Firebase not initialized. Please refresh the page.');
      setIsLoading(false);
      setConnectionStatus('disconnected');
      return;
    }
    
    // Cleanup previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    setIsLoading(true);
    setError(null);
    setConnectionStatus('checking');
    
    // Set timeout - if loading takes more than 15 seconds on mobile, 8 seconds on desktop
    // Mobile may need more time for WebSocket connection to establish
    const timeoutDuration = isMobile ? 15000 : 8000;
    let timeoutFired = false;
    const timeout = setTimeout(() => {
      timeoutFired = true;
      setIsLoading(false);
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
      const protocol = typeof window !== 'undefined' ? window.location.protocol : 'unknown';
      setError(`Firebase connection timeout (${timeoutDuration/1000}s). Current domain: ${currentDomain}. Protocol: ${protocol}. Mobile issue: Check 1) Firebase Console → Authentication → Authorized domains (must include ${currentDomain}), 2) Try WiFi instead of cellular, 3) Check mobile browser console for CORS/WebSocket errors. Tap "Retry".`);
      setConnectionStatus('disconnected');
      // Cleanup listener if timeout fires
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }, timeoutDuration);
    
    try {
      // Double-check database is available (mobile-specific check)
      if (!database) {
        clearTimeout(timeout);
        setIsLoading(false);
        setError('Firebase database not initialized. Please refresh the page.');
        setConnectionStatus('disconnected');
        return;
      }
      
      // Check if site is accessed over HTTP (Firebase WebSocket requires HTTPS)
      if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
        clearTimeout(timeout);
        setIsLoading(false);
        setError('Firebase requires HTTPS for WebSocket connections. Please access the site via https://lawb.xyz (not http://).');
        setConnectionStatus('disconnected');
        return;
      }
      
      const roomPath = currentRoom === 'public' 
        ? 'chess_chat/public/messages'
        : `chess_chat/private/${currentInviteCode}/messages`;
      
      const messagesRef = ref(database, roomPath);
      const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(100));
      
      // Set up real-time listener (works on both desktop and mobile)
      unsubscribeRef.current = onValue(messagesQuery, (snapshot) => {
        // Only process if timeout hasn't fired
        if (timeoutFired) {
          return;
        }
        
        // Clear timeout on success
        clearTimeout(timeout);
        
        const messagesData: ChatMessage[] = [];
        
        if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const message = {
            id: childSnapshot.key!,
            ...childSnapshot.val()
          } as ChatMessage;
          messagesData.push(message);
        });
        }
        
        // Sort by timestamp
        messagesData.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesData);
        setIsLoading(false);
        setConnectionStatus('connected');
        
        // Scroll to bottom after messages load
        setTimeout(scrollToBottom, 100);
      }, (error) => {
        // Only process if timeout hasn't fired
        if (timeoutFired) {
          return;
        }
        
        // Clear timeout on error
        clearTimeout(timeout);
        const errorMsg = error.message || 'Connection error';
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
        const errorCode = (error as any)?.code || 'unknown';
        setError(`Firebase error: ${errorMsg} (Code: ${errorCode}). Current domain: ${currentDomain}. Check Firebase Console → Authentication → Authorized domains includes this domain. Tap "Retry".`);
        setIsLoading(false);
        setConnectionStatus('disconnected');
      });
      
    } catch (err: any) {
      // Only process if timeout hasn't fired
      if (timeoutFired) {
        return;
      }
      
      // Clear timeout on exception
      clearTimeout(timeout);
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
      const errorCode = err?.code || 'unknown';
      setError(`Exception: ${err.message || 'Unknown error'} (Code: ${errorCode}). Current domain: ${currentDomain}. Check Firebase Console authorized domains. Tap "Retry".`);
      setIsLoading(false);
      setConnectionStatus('disconnected');
    }
  }, [isOpen, currentRoom, currentInviteCode, isMobile]);
  
  // Send message to Firebase
  const sendMessage = async () => {
    if (!newMessage.trim() || !isConnected || !walletAddress) return;
    
    const displayName = await getDisplayName();
    
    const messageData = {
      userId: walletAddress,
      walletAddress: walletAddress,
      displayName: displayName,
      message: newMessage.trim(),
      timestamp: Date.now(),
      room: currentRoom,
      ...(currentRoom === 'private' && { inviteCode: currentInviteCode })
    };
    
    try {
      const roomPath = currentRoom === 'public' 
        ? 'chess_chat/public/messages'
        : `chess_chat/private/${currentInviteCode}/messages`;
      
      const messagesRef = ref(database, roomPath);
      await push(messagesRef, messageData);
      
      setNewMessage('');
      inputRef.current?.focus();
      
      // Update display name map for current user
      setDisplayNameMap(prev => ({
        ...prev,
        [walletAddress.toLowerCase()]: displayName
      }));
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };
  
  // Draggable functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable || isBaseMiniApp) return;
    
    e.preventDefault();
    setIsDragging(true);
    const rect = chatRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  }, [isDragging, dragOffset]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);
  
  // Resizable functionality
  const handleResizeStart = (e: React.MouseEvent) => {
    if (!isResizable) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };
  
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      setSize({
        width: Math.max(300, resizeStart.width + deltaX),
        height: Math.max(400, resizeStart.height + deltaY)
      });
    }
  }, [isResizing, resizeStart]);
  
  // Switch between public and private chat
  const switchToPublic = () => {
    setCurrentRoom('public');
  };
  
  const switchToPrivate = () => {
    if (currentInviteCode) {
      setCurrentRoom('private');
    }
  };
  
  // Effects
  useEffect(() => {
    if (isOpen) {
      void loadMessages();
    }
    
    return () => {
      // Cleanup Firebase listener properly
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isOpen, currentRoom, currentInviteCode, loadMessages]);
  
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleResizeMove, handleMouseUp]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Fetch display names and profile pictures for all unique wallet addresses in messages
  useEffect(() => {
    if (messages.length === 0) return;
    
    const fetchDisplayNamesAndPictures = async () => {
      const uniqueAddresses = new Set<string>();
      messages.forEach(msg => {
        if (msg.walletAddress) {
          uniqueAddresses.add(msg.walletAddress.toLowerCase());
        }
      });
      
      const addressesToFetch = Array.from(uniqueAddresses).filter(addr => 
        !fetchedAddressesRef.current.has(addr) && !displayNameMap[addr]
      );
      
      if (addressesToFetch.length === 0) return;
      
      const newDisplayNameMap: Record<string, string> = {};
      const newProfilePictureMap: Record<string, string> = {};
      const promises = addressesToFetch.map(async (addr) => {
        fetchedAddressesRef.current.add(addr);
        try {
          const displayName = await getDisplayNameUtil(addr);
          newDisplayNameMap[addr] = displayName;
          
          // Fetch profile picture
          try {
            const profile = await firebaseProfiles.getProfile(addr);
            if (profile?.profile_picture?.image_url) {
              newProfilePictureMap[addr] = profile.profile_picture.image_url;
            } else {
              newProfilePictureMap[addr] = '/images/sticker4.png';
            }
          } catch (profileError) {
            newProfilePictureMap[addr] = '/images/sticker4.png';
          }
        } catch (error) {
          console.error(`Error fetching display name for ${addr}:`, error);
          newDisplayNameMap[addr] = formatAddress(addr);
          newProfilePictureMap[addr] = '/images/sticker4.png';
        }
      });
      
      await Promise.all(promises);
      setDisplayNameMap(prev => ({ ...prev, ...newDisplayNameMap }));
      setProfilePictureMap(prev => ({ ...prev, ...newProfilePictureMap }));
    };
    
    void fetchDisplayNamesAndPictures();
  }, [messages, displayNameMap]);
  
  // Auto-switch to private chat when in a game, or ensure public when no invite code
  useEffect(() => {
    if (currentInviteCode && currentRoom === 'public') {
      setCurrentRoom('private');
    } else if (!currentInviteCode) {
      // Always default to public when there's no invite code
      if (currentRoom !== 'public') {
        setCurrentRoom('public');
      }
    }
  }, [currentInviteCode]);
  
  // Reset to public room when chat opens without invite code
  useEffect(() => {
    if (isOpen && !currentInviteCode && currentRoom !== 'public') {
      setCurrentRoom('public');
    }
  }, [isOpen, currentInviteCode, currentRoom]);
  
  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('[ChessChat] Chat is OPEN', { isMobile, isBaseMiniApp, isOpen });
    } else {
      console.log('[ChessChat] Chat is CLOSED', { isMobile, isBaseMiniApp, isOpen });
    }
  }, [isOpen, isMobile, isBaseMiniApp]);
  
  // Log after render to verify element exists (MUST be before early return to follow React hooks rules)
  const mobileStyle = isMobile || isBaseMiniApp;
  useEffect(() => {
    if (!isOpen) return; // Early return inside effect is fine
    if (chatRef.current) {
      const rect = chatRef.current.getBoundingClientRect();
      const styles = window.getComputedStyle(chatRef.current);
      console.log('[ChessChat] Element rendered:', {
        exists: !!chatRef.current,
        visible: styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0',
        dimensions: { width: rect.width, height: rect.height },
        position: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
        zIndex: styles.zIndex,
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        pointerEvents: styles.pointerEvents
      });
    } else {
      console.warn('[ChessChat] Element ref is null after render!');
    }
  }, [isOpen, mobileStyle]);
  
  if (!isOpen) {
    console.log('[ChessChat] Returning null because isOpen is false');
    return null;
  }
  
  // When inside Popup, use relative positioning and fill container
  // When standalone, use fixed positioning
  // NOTE: isDraggable/isResizable being false doesn't mean we're in a Popup - 
  // it could also mean we're in BaseApp where dragging/resizing is disabled
  // We should only use relative positioning if we're actually inside a Popup container
  // For now, always use fixed positioning when rendered directly (not in Popup)
  const isInsidePopup = false; // Always use fixed positioning for direct rendering
  const chatStyle = mobileStyle ? (isInsidePopup ? {
    // Inside Popup: fill the parent wrapper (which already compensates for Popup padding)
    position: 'relative' as const,
    width: '100%' as const,
    height: '100%' as const,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    boxSizing: 'border-box' as const,
    pointerEvents: 'auto' as const,
    visibility: 'visible' as const,
    opacity: 1,
    background: '#c0c0c0' as const,
    border: 'none' as const, // Popup already has border
    margin: 0,
    padding: 0,
    zIndex: 1,
    overflow: 'hidden' as const,
    minHeight: 0,
    flex: 1
  } : {
    // Standalone: fixed positioning - use viewport units to ensure full screen coverage
    position: 'fixed' as const,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100vw' as const,
    height: '100vh' as const,
    zIndex: 100001, // Higher than Taskbar menu (100000) to ensure it's on top
    pointerEvents: 'auto' as const, // Ensure chat can receive clicks
    display: 'flex' as const,
    flexDirection: 'column' as const,
    boxSizing: 'border-box' as const,
    visibility: 'visible' as const,
    opacity: 1,
    background: '#c0c0c0' as const, // Explicit background so we can see it
    border: '2px outset #fff' as const,
    margin: 0,
    padding: '12px',
    paddingBottom: '72px' // 60px taskbar + 12px padding
  }) : {
    position: 'fixed' as const,
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    zIndex: 100001,
    pointerEvents: 'auto' as const,
    visibility: 'visible' as const,
    opacity: 1
  };
  
  console.log('[ChessChat] Rendering chat window', { 
    mobileStyle, 
    chatStyle, 
    isOpen, 
    isMobile,
    isBaseMiniApp,
    className: `chess-chat-window ${mobileStyle ? 'mobile' : 'desktop'}`,
    showPublicChat: 'N/A (BaseApp context)' 
  });
  
  return (
    <div
      ref={chatRef}
      className={`chess-chat-window ${mobileStyle ? 'mobile' : 'desktop'}`}
      style={chatStyle}
    >
      {/* Chat Header */}
      <div 
        className="chat-header"
        onMouseDown={handleMouseDown}
      >
        <div className="chat-title">
          <span className="chat-icon">💬</span>
          {currentRoom === 'public' ? 'Public Chat' : 'Game Chat'}
        </div>
        <div className="chat-controls">
          <button className="chat-btn minimize-btn" onClick={onMinimize}>_</button>
        </div>
      </div>
      
      {/* Chat Room Tabs */}
      <div className="chat-tabs">
        <button
          className={`chat-tab ${currentRoom === 'public' ? 'active' : ''}`}
          onClick={switchToPublic}
        >
          Public
        </button>
        {currentInviteCode && (
          <button
            className={`chat-tab ${currentRoom === 'private' ? 'active' : ''}`}
            onClick={switchToPrivate}
          >
            Game
          </button>
        )}
      </div>
      
      {/* Messages Area */}
      <div className="chat-messages">
        {/* Connection Status */}
        {connectionStatus === 'checking' && (
          <div className="chat-status" style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
            Checking connection...
          </div>
        )}
        {connectionStatus === 'disconnected' && !error && (
          <div className="chat-status" style={{ padding: '10px', textAlign: 'center', color: '#d00', fontWeight: 'bold' }}>
            ⚠️ Disconnected from Firebase
          </div>
        )}
        
        {isLoading && (
          <div className="chat-loading" style={{ padding: '10px', textAlign: 'center' }}>
            Loading messages... {connectionStatus === 'checking' && '(Testing connection)'}
          </div>
        )}
        
        {error && (
          <div className="chat-error" style={{ 
            padding: '15px', 
            margin: '10px', 
            background: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>{error}</div>
            <button
              onClick={() => {
                setError(null);
                void loadMessages();
              }}
              style={{
                padding: '8px 16px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Retry
            </button>
          </div>
        )}
        
        {!isConnected && (
          <div className="chat-notice">
            Connect your wallet to send messages
          </div>
        )}
        
        {messages.map((message) => {
          const walletAddr = message.walletAddress?.toLowerCase() || '';
          const displayName = displayNameMap[walletAddr] || message.displayName;
          const profilePicture = profilePictureMap[walletAddr] || '/images/sticker4.png';
          return (
            <div key={message.id} className="chat-message">
              <div className="message-header">
                {!isMobile && (
                  <img 
                    src={profilePicture}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.src = '/images/sticker4.png';
                    }}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '0',
                      objectFit: 'cover',
                      border: '2px solid rgba(0, 0, 0, 0.3)',
                      marginRight: '10px',
                      flexShrink: 0,
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                    }}
                  />
                )}
                <span className="message-author">
                  {displayName}
                </span>
                <span className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">
                {message.message}
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="chat-input-area">
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "Type your message..." : "Connect wallet to chat"}
          disabled={!isConnected}
          className="chat-input"
        />
        <button
          onClick={() => void sendMessage()}
          disabled={!isConnected || !newMessage.trim()}
          className="chat-send-btn"
        >
          Send
        </button>
      </div>
      
      {/* Resize Handle */}
      {isResizable && !isBaseMiniApp && (
        <div
          className="chat-resize-handle"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
};
