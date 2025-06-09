import React from 'react';
import { useNotifications } from '../context/NotificationsContext';
import { NavLink } from 'react-router-dom';
import {
  IconButton,
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  Badge,
  ListDivider,
  Typography,
  Box,
  Tooltip, // <-- Импортируем Tooltip
} from '@mui/joy';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MarkChatReadIcon from '@mui/icons-material/MarkChatRead'; // <-- Иконка для кнопки

function NotificationBell() {
  // --- ИЗМЕНЕНО: Достаем markAllAsRead ---
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.notification_id);
    }
  };

  return (
    <Dropdown>
      <MenuButton
        slots={{ root: IconButton }}
        slotProps={{ root: { variant: 'plain', color: 'neutral' } }}
      >
        <Badge badgeContent={unreadCount} color="danger" max={99}>
          <NotificationsIcon />
        </Badge>
      </MenuButton>
      <Menu sx={{ minWidth: 320, p: 1, gap: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
            <Typography level="title-md">Notifications</Typography>
            {/* --- ДОБАВЛЕНО: Кнопка "Прочитать все" --- */}
            <Tooltip title="Mark all as read" variant="outlined" size="sm">
                <IconButton 
                    size="sm" 
                    variant="plain" 
                    color="primary"
                    disabled={unreadCount === 0}
                    onClick={markAllAsRead}
                >
                    <MarkChatReadIcon />
                </IconButton>
            </Tooltip>
        </Box>
        <ListDivider />
        {notifications.length > 0 ? (
          notifications.slice(0, 5).map(n => (
            <MenuItem 
              key={n.notification_id} 
              component={NavLink} 
              to={n.link || '#'}
              onClick={() => handleNotificationClick(n)}
              sx={{ 
                bgcolor: n.read ? 'transparent' : 'primary.softBg',
                borderRadius: 'sm',
                '&:hover': {
                    bgcolor: n.read ? 'background.level1' : 'primary.softHoverBg'
                }
            }}
            >
                <Box>
                    <Typography level="title-sm">{n.title}</Typography>
                    <Typography level="body-sm">{n.message}</Typography>
                    <Typography level="body-xs" textColor="text.tertiary">
                        {new Date(n.created_at).toLocaleString()}
                    </Typography>
                </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <Typography sx={{ textAlign: 'center', width: '100%' }}>No notifications yet.</Typography>
          </MenuItem>
        )}
        <ListDivider />
        <MenuItem component={NavLink} to="/notifications" sx={{ borderRadius: 'sm' }}>
            <Typography level="body-sm" sx={{ textAlign: 'center', width: '100%' }}>View all notifications</Typography>
        </MenuItem>
      </Menu>
    </Dropdown>
  );
}

export default NotificationBell;