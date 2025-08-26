import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { 
  ChatMessage as ChatMessageType,
  sendPublicMessage,
  sendPrivateMessage,
  listenToPublicChat,
  listenToPrivateChat,
  getDisplayName
} from '../firebaseChat';

interface ChessChatProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  currentInviteCode?: string;
  isInGame?: boolean;
}

export const ChessChat: React.FC<ChessChatProps> = ({
  isOpen,
  onClose,
  onMinimize,
  currentInviteCode,
  isInGame = false
}) => {
  const { address: walletAddress, isConnected } = useAccount();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [currentRoom, setCurrentRoom] = useState<'public' | 'private'>('public');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen to chat messages
  useEffect(() => {
    if (!isOpen) return;

    let unsubscribe: (() => void) | null = null;

    if (currentRoom === 'public') {
      unsubscribe = listenToPublicChat((newMessages) => {
        setMessages(newMessages);
        setIsLoading(false);
      });
    } else if (currentRoom === 'private' && currentInviteCode) {
      unsubscribe = listenToPrivateChat(currentInviteCode, (newMessages) => {
        setMessages(newMessages);
        setIsLoading(false);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isOpen, currentRoom, currentInviteCode]);

  // Handle sending messages
  const handleSendMessage = async (message: string) => {
    if (!isConnected || !walletAddress) {
      setError('Please connect your wallet to send messages');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const displayName = getDisplayName(walletAddress);

      if (currentRoom === 'public') {
        await sendPublicMessage(walletAddress, message, displayName);
      } else if (currentRoom === 'private' && currentInviteCode) {
        await sendPrivateMessage(currentInviteCode, walletAddress, message, displayName);
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle room switching
  const handleRoomSwitch = (room: 'public' | 'private') => {
    setCurrentRoom(room);
    setMessages([]);
    setIsLoading(true);
  };

  // Handle minimize
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (onMinimize) {
      onMinimize();
    }
  };

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      const rect = chatWindowRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  return (
    <div
      ref={chatWindowRef}
      style={{
        position: 'fixed',
        top: isMinimized ? 'calc(100vh - 40px)' : `${position.y}px`,
        left: isMinimized ? '50%' : `${position.x}px`,
        transform: isMinimized ? 'translateX(-50%)' : 'none',
        width: isMinimized ? '200px' : '400px',
        height: isMinimized ? '40px' : '500px',
        background: '#f0f0f0',
        border: '3px outset #c0c0c0',
        borderRadius: '0',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'MS Sans Serif, Microsoft Sans Serif, sans-serif',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#c0c0c0',
          padding: '8px 12px',
          borderBottom: '2px inset #c0c0c0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'move',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        <div style={{ fontWeight: 'bold', color: '#000' }}>
          LAWB CHESS CHAT
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {onMinimize && (
            <button
              onClick={handleMinimize}
              style={{
                width: '16px',
                height: '16px',
                background: '#c0c0c0',
                border: '2px outset #c0c0c0',
                cursor: 'pointer',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isMinimized ? '□' : '_'}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              width: '16px',
              height: '16px',
              background: '#c0c0c0',
              border: '2px outset #c0c0c0',
              cursor: 'pointer',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Room Selector - Only show when not minimized */}
      {!isMinimized && (
        <div
          style={{
            padding: '8px',
            borderBottom: '1px solid #c0c0c0',
            display: 'flex',
            gap: '4px'
          }}
        >
        <button
          onClick={() => handleRoomSwitch('public')}
          style={{
            padding: '4px 8px',
            background: currentRoom === 'public' ? '#ff0000' : '#c0c0c0',
            color: currentRoom === 'public' ? 'white' : 'black',
            border: '2px outset #c0c0c0',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 'bold'
          }}
        >
          Public Chat
        </button>
        {isInGame && currentInviteCode && (
          <button
            onClick={() => handleRoomSwitch('private')}
            style={{
              padding: '4px 8px',
              background: currentRoom === 'private' ? '#ff0000' : '#c0c0c0',
              color: currentRoom === 'private' ? 'white' : 'black',
              border: '2px outset #c0c0c0',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 'bold'
            }}
          >
            Game Chat
          </button>
        )}
      </div>
      )}

      {/* Connection Status - Only show when not minimized */}
      {!isMinimized && !isConnected && (
        <div
          style={{
            padding: '8px',
            background: '#ffcccc',
            color: '#cc0000',
            fontSize: '11px',
            textAlign: 'center',
            borderBottom: '1px solid #c0c0c0'
          }}
        >
          Connect wallet to send messages
        </div>
      )}

      {/* Error Message - Only show when not minimized */}
      {!isMinimized && error && (
        <div
          style={{
            padding: '8px',
            background: '#ffcccc',
            color: '#cc0000',
            fontSize: '11px',
            textAlign: 'center',
            borderBottom: '1px solid #c0c0c0'
          }}
        >
          {error}
        </div>
      )}

      {/* Messages - Only show when not minimized */}
      {!isMinimized && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
        {isLoading && (
          <div style={{ textAlign: 'center', color: '#666', fontSize: '11px' }}>
            Loading messages...
          </div>
        )}
        
        {messages.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', color: '#666', fontSize: '11px' }}>
            {currentRoom === 'public' ? 'No messages yet. Be the first to chat!' : 'No game messages yet.'}
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isOwnMessage={message.walletAddress === walletAddress}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      )}

      {/* Input - Only show when not minimized */}
      {!isMinimized && (
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={!isConnected || isLoading}
          placeholder={!isConnected ? "Connect wallet to chat..." : "Type a message..."}
        />
      )}
    </div>
  );
};
