// frontend/src/context/ChatProvider.js

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext'; // Используем наш основной AuthContext
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const ChatContext = createContext(null);
export const useChat = () => useContext(ChatContext);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const ChatProvider = ({ children }) => {
  // --- ИЗМЕНЕНИЕ: Получаем сокет из AuthContext, а не создаем новый ---
  const { isLoggedIn, authToken, socket, user: currentUser } = useAuth(); 

  const [conversations, setConversations] = useState({});
  
  // --- ИЗМЕНЕНИЕ: Этот useEffect теперь просто слушает события на готовом сокете ---
  useEffect(() => {
    // Если сокета нет (пользователь не залогинен или сокет еще не подключился), ничего не делаем
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (!currentUser) return;
      
      const otherUserId = message.sender.id === currentUser.id ? message.receiver.id : message.sender.id;
      
      setConversations(prev => {
        const currentMessages = prev[otherUserId] || [];
        // Проверка на дубликаты, на всякий случай
        if (currentMessages.find(m => m.id === message.id)) return prev;
        return { ...prev, [otherUserId]: [...currentMessages, message] };
      });
    };

    // Вешаем слушатель на существующий сокет
    socket.on('newMessage', handleNewMessage);

    // Убираем слушатель при размонтировании компонента или отключении сокета
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, currentUser]); // Зависим от сокета из AuthContext

  const sendMessage = useCallback((recipientId, content) => {
    // Используем тот же сокет для отправки
    if (socket?.connected) {
      socket.emit('sendMessage', { recipientId, content });
    }
  }, [socket]);

  const loadConversationHistory = useCallback(async (otherUserId) => {
    try {
      // Заголовки авторизации уже установлены в AuthContext
      const response = await axios.get(`/messages/conversation/${otherUserId}`);
      
      setConversations(prev => ({
        ...prev,
        [otherUserId]: response.data,
      }));
    } catch (error) {
      console.error("Failed to load conversation history", error);
    }
  }, []);

  const value = useMemo(() => ({
    sendMessage,
    conversations,
    loadConversationHistory,
    isConnected: socket?.connected || false,
  }), [sendMessage, conversations, loadConversationHistory, socket?.connected]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};