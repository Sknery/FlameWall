import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user: currentUser, socket } = useAuth(); // <-- Берем готовый сокет
  const [conversations, setConversations] = useState({});
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message) => {
        const otherUserId = message.sender.id === currentUser.id ? message.receiver.id : message.sender.id;
        setConversations(prev => {
          const currentMessages = prev[otherUserId] || [];
          if (currentMessages.find(m => m.id === message.id)) return prev;
          return { ...prev, [otherUserId]: [...currentMessages, message] };
        });
      };
      socket.on('newMessage', handleNewMessage);
      return () => { socket.off('newMessage', handleNewMessage); };
    }
  }, [socket, currentUser?.id]);
  
  //... остальные функции (sendMessage, loadConversationHistory, value) остаются как в вашей версии...
  const sendMessage = useCallback((recipientId, content) => {
    if (socket?.connected) {
      socket.emit('sendMessage', { recipientId, content });
    }
  }, [socket]);
  
  const loadConversationHistory = useCallback(async (otherUserId) => {
    // ... логика загрузки ...
  }, [socket]); // Зависимость от сокета, чтобы убедиться, что он есть

  const value = useMemo(() => ({
    sendMessage,
    conversations,
    loadConversationHistory,
    isConnected: socket?.connected || false,
  }), [sendMessage, conversations, loadConversationHistory, socket?.connected]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};