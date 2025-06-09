import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext'; // Нам по-прежнему нужен сокет отсюда
import axios from 'axios';
import toast from 'react-hot-toast';
import { Alert, Typography, Link as JoyLink, Box } from '@mui/joy';
import InfoIcon from '@mui/icons-material/Info';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
const NotificationsContext = createContext(null);
export const useNotifications = () => useContext(NotificationsContext);

const NotificationToast = ({ notification, toastInstance }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (notification.link) navigate(notification.link);
    toast.dismiss(toastInstance.id);
  };

  return (
    <JoyLink onClick={handleClick} overlay sx={{ textDecoration: 'none', cursor: 'pointer' }}>
      <Alert
        key={notification.notification_id}
        variant="soft"
        color="primary"
        startDecorator={<InfoIcon />}
        sx={{ boxShadow: 'lg', width: '350px' }}
      >
        <div>
          <Typography fontWeight="lg">{notification.title}</Typography>
          <Typography level="body-sm">{notification.message}</Typography>
        </div>
      </Alert>
    </JoyLink>
  );
};

export const NotificationsProvider = ({ children }) => {
  const { isLoggedIn, authToken, socket } = useAuth(); // <-- Берем готовый сокет
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
    if (isLoggedIn) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isLoggedIn, fetchNotifications]);

  // УПРОЩЕННЫЙ И БОЛЕЕ НАДЕЖНЫЙ useEffect
  useEffect(() => {
    if (socket) { // <-- Просто проверяем, есть ли сокет
      const handleNewNotification = (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.custom(/* ... */);
      };
      socket.on('newNotification', handleNewNotification);
      return () => { socket.off('newNotification', handleNewNotification); };
    }
  }, [socket]); // Зависимость только от сокета

  const markAsRead = useCallback(async (notificationId) => {
    const notification = notifications.find(n => n.notification_id === notificationId);
    if (notification && notification.read) return;
    setNotifications(prev => prev.map(n => 
      n.notification_id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
    try {
      await axios.post(`${API_BASE_URL}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  }, [authToken, notifications]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    markAsRead,
  }), [notifications, unreadCount, markAsRead]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};