import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { isLoggedIn, authToken } = useAuth();
  const socketRef = useRef(null);

  const [lastMessage, setLastMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isLoggedIn && authToken) {
      // Создаем соединение, передавая токен в опции `auth`
      const newSocket = io(process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000', {
        transports: ['websocket'],
        auth: { // <-- ИСПОЛЬЗУЕМ ЭТОТ ОФИЦИАЛЬНЫЙ СПОСОБ
          token: authToken,
        },
      });
      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected with auth!');
      });
      
      newSocket.on('disconnect', () => setIsConnected(false));
      newSocket.on('newMessage', (msg) => setLastMessage(msg));
      
      return () => {
        newSocket.disconnect();
      };
    } else {
        if(socketRef.current) {
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

  const value = useMemo(() => ({
    sendMessage,
    lastMessage,
    isConnected,
  }), [sendMessage, lastMessage, isConnected]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};