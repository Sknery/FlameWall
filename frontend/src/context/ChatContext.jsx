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
      if (!socketRef.current) {
        console.log('ChatContext: Connecting with auth token...');
        
        // ИЗМЕНЕНИЕ ЗДЕСЬ: используем официальную опцию `auth` для передачи токена
        socketRef.current = io(process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000', {
          transports: ['websocket'],
          auth: {
            token: authToken,
          },
        });

        socketRef.current.on('connect', () => {
          setIsConnected(true);
          console.log('%cChatContext: Socket connected!', 'color: green');
        });
        
        socketRef.current.on('connect_error', (err) => {
          console.error(`Socket connection error: ${err.message}`);
        });

        socketRef.current.on('disconnect', () => {
          setIsConnected(false);
          console.log('%cChatContext: Socket disconnected!', 'color: red');
        });

        socketRef.current.on('newMessage', (message) => {
          setLastMessage(message);
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

  const value = useMemo(() => ({
    sendMessage,
    lastMessage,
    isConnected,
  }), [sendMessage, lastMessage, isConnected]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};