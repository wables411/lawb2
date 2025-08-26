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

interface SidebarChatProps {
  currentInviteCode?: string;
  isInGame?: boolean;
}

export const SidebarChat: React.FC<SidebarChatProps> = ({
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
    let unsubscribe: (() => void) | null = null;
    console.log('[SidebarChat] Setting up chat listener for room:', currentRoom, 'inviteCode:', currentInviteCode);

    if (currentRoom === 'public') {
      unsubscribe = listenToPublicChat((newMessages) => {
        console.log('[SidebarChat] Received public messages:', newMessages.length);
        setMessages(newMessages);
        setIsLoading(false);
      });
    } else if (currentRoom === 'private' && currentInviteCode) {
      unsubscribe = listenToPrivateChat(currentInviteCode, (newMessages) => {
        console.log('[SidebarChat] Received private messages:', newMessages.length);
        setMessages(newMessages);
        setIsLoading(false);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentRoom, currentInviteCode]);

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

  console.log('[SidebarChat] Rendering with messages:', messages.length, 'isLoading:', isLoading, 'error:', error);
  
  return (
    <div className="sidebar-chat-compact">
      <h3>Chat ({messages.length})</h3>
      
      {/* Room Selector */}
      <div className="chat-room-selector">
        <button
          className={`chat-room-btn ${currentRoom === 'public' ? 'selected' : ''}`}
          onClick={() => handleRoomSwitch('public')}
        >
          Public
        </button>
        {isInGame && currentInviteCode && (
          <button
            className={`chat-room-btn ${currentRoom === 'private' ? 'selected' : ''}`}
            onClick={() => handleRoomSwitch('private')}
          >
            Game
          </button>
        )}
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="chat-connection-warning">
          Connect wallet to chat
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="chat-error-message">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages-container">
        {isLoading && (
          <div className="chat-loading">
            Loading messages...
          </div>
        )}
        
        {messages.length === 0 && !isLoading && (
          <div className="chat-empty">
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
