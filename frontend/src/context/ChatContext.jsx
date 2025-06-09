import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';

const ChatContext = createContext(null);
export const useChat = () => useContext(ChatContext);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const ChatProvider = ({ children }) => {
  const { isLoggedIn, authToken } = useAuth();
  const socketRef = useRef(null);

  const [conversations, setConversations] = useState({});
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    if (isLoggedIn && authToken) {
      if (!socketRef.current) {
        const newSocket = io(API_BASE_URL, {
          transports: ['websocket'],
          auth: { token: authToken },
        });
        socketRef.current = newSocket;

        newSocket.on('newMessage', (message) => {
          const currentUser = jwtDecode(authToken);
          const otherUserId = message.sender.id === currentUser.sub ? message.receiver.id : message.sender.id;
          
          setConversations(prev => {
            const currentMessages = prev[otherUserId] || [];
            if (currentMessages.find(m => m.id === message.id)) return prev;
            return { ...prev, [otherUserId]: [...currentMessages, message] };
          });
        });
      }
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }
  }, [isLoggedIn, authToken]);

  const sendMessage = useCallback((recipientId, content) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('sendMessage', { recipientId, content });
    }
  }, []);
  
  const loadConversationHistory = useCallback(async (otherUserId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const response = await axios.get(`${API_BASE_URL}/messages/conversation/${otherUserId}`, config);
      
      setConversations(prev => ({
        ...prev,
        [otherUserId]: response.data,
      }));
    } catch (error) {
      console.error("Failed to load conversation history", error);
    }
  }, [authToken]);

  const value = useMemo(() => ({
    sendMessage,
    conversations,
    loadConversationHistory,
    isConnected: socketRef.current?.connected || false,
  }), [sendMessage, conversations, loadConversationHistory, socketRef.current?.connected]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};