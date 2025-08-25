import React from 'react';
import { ChatMessage as ChatMessageType } from '../firebaseChat';

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '8px',
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
        maxWidth: '80%'
      }}
    >
      <div
        style={{
          background: isOwnMessage ? '#ff0000' : '#333',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          wordWrap: 'break-word',
          maxWidth: '100%',
          border: '1px solid #666'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '10px' }}>
          {message.displayName}
        </div>
        <div>{message.message}</div>
      </div>
      <div 
        style={{ 
          fontSize: '10px', 
          color: '#666', 
          marginTop: '2px',
          marginLeft: isOwnMessage ? '0' : '8px',
          marginRight: isOwnMessage ? '8px' : '0'
        }}
      >
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
};
