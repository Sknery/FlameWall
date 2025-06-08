import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext'; // Нам нужен сокет из ChatContext
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
const NotificationsContext = createContext(null);
export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }) => {
  const { isLoggedIn, authToken } = useAuth();
  const { isConnected, socket } = useChat(); // Получаем сокет из ChatContext

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Загружаем первоначальные уведомления при входе в систему
  useEffect(() => {
    if (isLoggedIn && authToken) {
      const fetchNotifications = async () => {
        try {
          const config = { headers: { Authorization: `Bearer ${authToken}` } };
          const response = await axios.get(`${API_BASE_URL}/notifications`, config);
          setNotifications(response.data);
          // Считаем количество непрочитанных
          setUnreadCount(response.data.filter(n => !n.read).length);
        } catch (error) {
          console.error("Failed to fetch notifications", error);
        }
      };
      fetchNotifications();
    } else {
      // Очищаем уведомления при выходе
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isLoggedIn, authToken]);

  // Слушаем новые уведомления по WebSocket
  useEffect(() => {
    if (isConnected && socket) {
      const handleNewNotification = (newNotification) => {
        // Добавляем новое уведомление в начало списка
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      };

      socket.on('newNotification', handleNewNotification);

      return () => {
        socket.off('newNotification', handleNewNotification);
      };
    }
  }, [isConnected, socket]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Обновляем состояние локально для мгновенной реакции UI
      setNotifications(prev => prev.map(n => 
        n.notification_id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
      
      // Отправляем запрос на бэкенд, чтобы пометить как прочитанное в БД
      await axios.post(`${API_BASE_URL}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      // Здесь можно добавить логику отката, если запрос не удался
    }
  }, [authToken]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    markAsRead,
  }), [notifications, unreadCount, markAsRead]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};