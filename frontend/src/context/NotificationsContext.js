import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Alert, Typography, Link as JoyLink } from '@mui/joy';
import InfoIcon from '@mui/icons-material/Info';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
const NotificationsContext = createContext(null);
export const useNotifications = () => useContext(NotificationsContext);

// NotificationToast остается без изменений
const NotificationToast = ({ notification, toastInstance }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (notification.link) navigate(notification.link);
    toast.dismiss(toastInstance.id);
  };
  return (
    <JoyLink onClick={handleClick} overlay sx={{ textDecoration: 'none', cursor: 'pointer' }}>
      <Alert key={notification.notification_id} variant="soft" color="primary" startDecorator={<InfoIcon />} sx={{ boxShadow: 'lg', width: '350px' }}>
        <div>
          <Typography fontWeight="lg">{notification.title}</Typography>
          <Typography level="body-sm">{notification.message}</Typography>
        </div>
      </Alert>
    </JoyLink>
  );
};


export const NotificationsProvider = ({ children }) => {
  const { isLoggedIn, authToken, socket } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [friendshipUpdateTrigger, setFriendshipUpdateTrigger] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!authToken) return;
    try {
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const response = await axios.get(`${API_BASE_URL}/notifications`, config);
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  }, [authToken]);

  useEffect(() => {
    if (isLoggedIn) fetchNotifications();
    else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isLoggedIn, fetchNotifications]);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = (newNotification) => {
        setNotifications(prev => prev.find(n => n.notification_id === newNotification.notification_id) ? prev : [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.custom((t) => <NotificationToast notification={newNotification} toastInstance={t} />);
        if (newNotification?.type?.startsWith('friendship.')) {
            setFriendshipUpdateTrigger(Date.now());
        }
      };
      socket.on('newNotification', handleNewNotification);
      return () => { socket.off('newNotification', handleNewNotification); };
    }
  }, [socket]);

  // --- ИЗМЕНЕНО: Стабилизируем функцию, убрав зависимость от 'notifications' ---
  const markAsRead = useCallback(async (notificationId) => {
    // Используем функциональное обновление, чтобы получить доступ к `prev` состоянию
    setNotifications(prevNotifications => {
        const notification = prevNotifications.find(n => n.notification_id === notificationId);
        if (!notification || notification.read) return prevNotifications; // Если нечего менять, возвращаем старое состояние
        
        // Оптимистично обновляем
        setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
        return prevNotifications.map(n => n.notification_id === notificationId ? { ...n, read: true } : n);
    });
    
    try {
      await axios.post(`${API_BASE_URL}/notifications/${notificationId}/read`, {}, { headers: { Authorization: `Bearer ${authToken}` } });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  }, [authToken]); // <-- Зависимость `notifications` убрана

  // --- ИЗМЕНЕНО: Стабилизируем функцию, убрав зависимость от 'unreadCount' ---
  const markAllAsRead = useCallback(async () => {
    // Оптимистичное обновление
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await axios.post(`${API_BASE_URL}/notifications/read-all`, {}, { headers: { Authorization: `Bearer ${authToken}` } });
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
      fetchNotifications(); // Откатываем в случае ошибки
    }
  }, [authToken, fetchNotifications]); // <-- Зависимость `unreadCount` убрана

  // --- ИЗМЕНЕНО: Эта функция уже была стабильной, но оставляем для полноты ---
  const markNotificationsAsReadByLink = useCallback(async (link) => {
    try {
        const { data } = await axios.post(`${API_BASE_URL}/notifications/read-by-link`, { link }, { headers: { Authorization: `Bearer ${authToken}` } });
        if (data.affected > 0) {
            fetchNotifications();
        }
    } catch (error) {
        console.error("Failed to mark by link", error);
    }
  }, [authToken, fetchNotifications]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    markAsRead,
    friendshipUpdateTrigger,
    markAllAsRead,
    markNotificationsAsReadByLink,
  }), [notifications, unreadCount, markAsRead, friendshipUpdateTrigger, markAllAsRead, markNotificationsAsReadByLink]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};