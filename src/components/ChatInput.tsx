import React, { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type a message..." 
}) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', padding: '8px' }}>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1,
          padding: '8px 12px',
          border: '2px inset #fff',
          background: '#000000',
          color: '#ff0000',
          fontSize: '12px',
          borderRadius: '4px'
        }}
      />
      <button
        onClick={handleSendMessage}
        disabled={disabled || !message.trim()}
        style={{
          padding: '8px 16px',
          background: disabled || !message.trim() ? '#666' : '#ff0000',
          color: 'white',
          border: '2px outset #fff',
          borderRadius: '4px',
          cursor: disabled || !message.trim() ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        Send
      </button>
    </div>
  );
};
