import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const ChatContext = createContext(null);
export const useChat = () => useContext(ChatContext);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const ChatProvider = ({ children }) => {
  const { isLoggedIn, authToken } = useAuth();
  const socketRef = useRef(null);

  const [conversations, setConversations] = useState({}); // { 'otherUserId': [messages] }
  const [isConnected, setIsConnected] = useState(false);
  const loadedConversationsRef = useRef(new Set()); // Храним ID диалогов, для которых уже загружена история

  useEffect(() => {
    if (isLoggedIn && authToken) {
      const newSocket = io(API_BASE_URL, {
        transports: ['websocket'],
        auth: { token: authToken },
      });
      socketRef.current = newSocket;

      newSocket.on('connect', () => setIsConnected(true));
      newSocket.on('disconnect', () => setIsConnected(false));

      newSocket.on('newMessage', (message) => {
        const currentUser = jwtDecode(authToken);
        const otherUserId = message.sender.id === currentUser.sub ? message.receiver.id : message.sender.id;
        
        setConversations(prev => {
          const currentMessages = prev[otherUserId] || [];
          // Добавляем сообщение, только если его еще нет
          if (currentMessages.find(m => m.id === message.id)) {
            return prev;
          }
          return {
            ...prev,
            [otherUserId]: [...currentMessages, message],
          };
        });
      });

      return () => {
        newSocket.disconnect();
        socketRef.current = null;
        loadedConversationsRef.current.clear();
      };
    }
  }, [isLoggedIn, authToken]);

  const sendMessage = useCallback((recipientId, content) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('sendMessage', { recipientId, content });
    }
  }, []);
  
  const loadConversationHistory = useCallback(async (otherUserId) => {
    // Не загружаем историю, если она уже была загружена
    if (loadedConversationsRef.current.has(otherUserId)) {
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const response = await axios.get(`${API_BASE_URL}/messages/conversation/${otherUserId}`, config);
      
      setConversations(prev => ({
        ...prev,
        [otherUserId]: response.data,
      }));
      // Помечаем, что история для этого диалога загружена
      loadedConversationsRef.current.add(otherUserId);
    } catch (error) {
      console.error("Failed to load conversation history", error);
    }
  }, [authToken]);

  const value = useMemo(() => ({
    sendMessage,
    conversations,
    loadConversationHistory,
    isConnected,
  }), [sendMessage, conversations, loadConversationHistory, isConnected]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};