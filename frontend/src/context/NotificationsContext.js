import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Убран RouterLink
import { useAuth } from './AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Alert, Typography, Link as JoyLink } from '@mui/joy'; // Убран Box
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
    if (isLoggedIn) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isLoggedIn, fetchNotifications]);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        toast.custom((t) => <NotificationToast notification={newNotification} toastInstance={t} />);
        
        if (newNotification?.type?.startsWith('friendship.')) {
            console.log('Friendship-related notification received, triggering UI update.');
            setFriendshipUpdateTrigger(Date.now());
        }
      };

      socket.on('newNotification', handleNewNotification);
      return () => { socket.off('newNotification', handleNewNotification); };
    }
  }, [socket]);

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
    friendshipUpdateTrigger,
  }), [notifications, unreadCount, markAsRead, friendshipUpdateTrigger]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};