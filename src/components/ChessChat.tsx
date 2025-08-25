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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '500px',
        background: '#f0f0f0',
        border: '3px outset #c0c0c0',
        borderRadius: '0',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'MS Sans Serif, Microsoft Sans Serif, sans-serif'
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
          cursor: 'move'
        }}
      >
        <div style={{ fontWeight: 'bold', color: '#000' }}>
          LAWB CHESS CHAT
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {onMinimize && (
            <button
              onClick={onMinimize}
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
              _
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

      {/* Room Selector */}
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

      {/* Connection Status */}
      {!isConnected && (
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

      {/* Error Message */}
      {error && (
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

      {/* Messages */}
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

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected || isLoading}
        placeholder={!isConnected ? "Connect wallet to chat..." : "Type a message..."}
      />
    </div>
  );
};
