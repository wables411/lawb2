import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { database } from '../firebaseApp';
import { ref, push, onValue, off, set, query, orderByChild, limitToLast } from 'firebase/database';
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
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentRoom, setCurrentRoom] = useState<'public' | 'private'>('public');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  
  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Get display name for current user
  const getDisplayName = () => {
    if (!walletAddress) return 'Anonymous';
    return formatAddress(walletAddress);
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Load messages from Firebase
  const loadMessages = useCallback(async () => {
    if (!isOpen) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const roomPath = currentRoom === 'public' 
        ? 'chess_chat/public/messages'
        : `chess_chat/private/${currentInviteCode}/messages`;
      
      const messagesRef = ref(database, roomPath);
      const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(100));
      
      onValue(messagesQuery, (snapshot) => {
        const messagesData: ChatMessage[] = [];
        snapshot.forEach((childSnapshot) => {
          const message = {
            id: childSnapshot.key!,
            ...childSnapshot.val()
          } as ChatMessage;
          messagesData.push(message);
        });
        
        // Sort by timestamp
        messagesData.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesData);
        
        // Scroll to bottom after messages load
        setTimeout(scrollToBottom, 100);
      });
      
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, currentRoom, currentInviteCode]);
  
  // Send message to Firebase
  const sendMessage = async () => {
    if (!newMessage.trim() || !isConnected || !walletAddress) return;
    
    const messageData = {
      userId: walletAddress,
      walletAddress: walletAddress,
      displayName: getDisplayName(),
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
    if (!isDraggable) return;
    
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
      // Cleanup Firebase listeners
      off(ref(database, 'chess_chat'));
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
  
  // Auto-switch to private chat when in a game
  useEffect(() => {
    if (currentInviteCode && currentRoom === 'public') {
      setCurrentRoom('private');
    }
  }, [currentInviteCode]);
  
  if (!isOpen) return null;
  
  return (
    <div
      ref={chatRef}
      className={`chess-chat-window ${isMobile ? 'mobile' : 'desktop'}`}
      style={isMobile ? {
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 10001
      } : {
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: 10001
      }}
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
        {isLoading && (
          <div className="chat-loading">
            Loading messages...
          </div>
        )}
        
        {error && (
          <div className="chat-error">
            {error}
          </div>
        )}
        
        {!isConnected && (
          <div className="chat-notice">
            Connect your wallet to send messages
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className="chat-message">
            <div className="message-header">
              <span className="message-author">
                {message.displayName}
              </span>
              <span className="message-time">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">
              {message.message}
            </div>
          </div>
        ))}
        
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
      {isResizable && (
        <div
          className="chat-resize-handle"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
};
