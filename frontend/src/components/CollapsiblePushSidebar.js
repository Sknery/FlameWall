import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Sheet,
  List,
  ListItem,
  ListItemButton,
  ListItemDecorator,
  ListItemContent,
  IconButton,
  Typography,
  Button,
  Input,
  Dropdown,
  Menu,
  MenuItem,
  MenuButton,
  Divider,
} from '@mui/joy';

import HomeIcon from '@mui/icons-material/Home';
import ArticleIcon from '@mui/icons-material/Article';
import ForumIcon from '@mui/icons-material/Forum';
import PeopleIcon from '@mui/icons-material/People';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AdbIcon from '@mui/icons-material/Adb';
import DiamondIcon from '@mui/icons-material/Diamond';
import LogoutIcon from '@mui/icons-material/Logout';
import MailIcon from '@mui/icons-material/Mail'; // Иконка для сообщений

const SIDEBAR_WIDTH = 280;
const MAIN_CONTENT_MAX_WIDTH = '1000px';
const LARGE_ICON_BUTTON_HEIGHT = '48px';

const navItems = [
  { name: 'Home', icon: <HomeIcon />, path: '/' },
  { name: 'News', icon: <ArticleIcon />, path: '/news' },
  {
    name: 'Community',
    icon: <PeopleIcon />,
    subItems: [
      { name: 'Posts', icon: <ForumIcon />, path: '/posts' },
      { name: 'Players', icon: <PeopleIcon />, path: '/players' },
    ],
  },
  {
    name: 'Store',
    icon: <StorefrontIcon />,
    subItems: [
      { name: 'Ranks', icon: <AdbIcon />, path: '/store/ranks' },
      { name: 'Items', icon: <DiamondIcon />, path: '/store/items' },
    ],
  },
  { name: 'Support', icon: <SupportAgentIcon />, path: '/support' },
];

const userNavItems = {
  name: 'My Profile',
  icon: <AccountCircleIcon />,
  subItems: [
    { name: 'Profile', icon: <AccountCircleIcon />, path: '/profile/me' },
    { name: 'Messages', icon: <MailIcon />, path: '/messages' }, // <-- Добавлена ссылка
    { name: 'Friends', icon: <GroupAddIcon />, path: '/friends' },
    { name: 'Settings', icon: <SettingsIcon />, path: '/profile/settings' },
  ],
};

const adminNavItem = {
  name: 'Admin Panel',
  icon: <AdminPanelSettingsIcon />,
  path: '/admin',
};


const CollapsiblePushSidebar = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openCategories, setOpenCategories] = useState({ Community: true });
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();

  const isAdmin = isLoggedIn && user && ['ADMIN', 'MODERATOR', 'OWNER'].includes(user.rank);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCategory = (categoryName) => setOpenCategories((prev) => ({ ...prev, [categoryName]: !prev[categoryName] }));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderNavItems = (items) => {
    return items.map((item) => (
      <ListItem key={item.name} nested={!!item.subItems}>
        {item.subItems ? (
          <ListItemButton onClick={() => toggleCategory(item.name)}>
            {item.icon && <ListItemDecorator>{item.icon}</ListItemDecorator>}
            <ListItemContent>{item.name}</ListItemContent>
            {openCategories[item.name] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </ListItemButton>
        ) : (
          <NavLink to={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
            {({ isActive }) => (
              <ListItemButton selected={isActive}>
                {item.icon && <ListItemDecorator>{item.icon}</ListItemDecorator>}
                <ListItemContent>{item.name}</ListItemContent>
              </ListItemButton>
            )}
          </NavLink>
        )}
        {item.subItems && openCategories[item.name] && (
          <List sx={{ '--List-nestedInsetStart': '20px', pt: 0.5 }}>
            {item.subItems.map((subItem) => (
              <ListItem key={subItem.name}>
                <NavLink to={subItem.path} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                  {({ isActive }) => (
                    <ListItemButton selected={isActive}>
                      {subItem.icon && <ListItemDecorator sx={{ color: 'text.tertiary' }}>{subItem.icon}</ListItemDecorator>}
                      <ListItemContent>{subItem.name}</ListItemContent>
                    </ListItemButton>
                  )}
                </NavLink>
              </ListItem>
            ))}
          </List>
        )}
      </ListItem>
    ));
  };


  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sheet
        variant="outlined"
        sx={{
          width: sidebarOpen ? SIDEBAR_WIDTH : 0,
          minWidth: sidebarOpen ? SIDEBAR_WIDTH : 0,
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          overflow: 'auto',
          transition: 'width 0.3s ease, min-width 0.3s ease',
          boxShadow: 'md',
          p: sidebarOpen ? 2 : 0,
          opacity: sidebarOpen ? 1 : 0,
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        {sidebarOpen && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AdbIcon sx={{ fontSize: 'xl2', color: 'primary.plainColor' }} />
                <Typography component="h2" fontWeight="lg">FlameWall</Typography>
              </Box>
              <IconButton onClick={toggleSidebar} variant="plain" color="neutral" size="sm"><ChevronLeftIcon /></IconButton>
            </Box>

            <List sx={{ '--List-nestedInsetStart': '20px' }}>
              {renderNavItems(navItems)}
              {isLoggedIn && renderNavItems([userNavItems])}
              {isLoggedIn && isAdmin && renderNavItems([adminNavItem])}
            </List>
          </>
        )}
      </Sheet>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, height: LARGE_ICON_BUTTON_HEIGHT, px: { xs: 0, sm: 1 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, minWidth: { md: '200px' } }}>
            {!sidebarOpen && (<IconButton onClick={toggleSidebar} variant="plain" color="neutral" size="lg"><ChevronRightIcon /></IconButton>)}
            <Input size="md" placeholder="Search..." startDecorator={<SearchIcon />} sx={{ display: { xs: 'none', md: 'inline-flex' } }} />
          </Box>

          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <AdbIcon color="primary" sx={{ fontSize: 'xl4' }} />
            <Typography fontWeight="lg" level="h2" component="div">FlameWall</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1.5 }, alignItems: 'center', flexShrink: 0, minWidth: { md: '200px' }, justifyContent: 'flex-end' }}>
            {isLoggedIn ? (
              <Dropdown>
                <MenuButton
                  slots={{ root: Button }}
                  slotProps={{ root: { variant: 'plain', color: 'neutral', size: 'md', startDecorator: <AccountCircleIcon /> } }}
                >
                  {user?.username}
                </MenuButton>
                <Menu>
                  <MenuItem component={NavLink} to="/profile/me">Profile</MenuItem>
                  <MenuItem component={NavLink} to="/profile/settings">Settings</MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: 'danger.500' }}>
                    <ListItemDecorator><LogoutIcon /></ListItemDecorator>
                    Logout
                  </MenuItem>
                </Menu>
              </Dropdown>
            ) : (
              <>
                <Button component={NavLink} to="/login" variant="outlined" color="neutral" size="md">
                  Login
                </Button>
                <Button component={NavLink} to="/register" variant="solid" color="primary" size="md">
                  Register
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Box sx={{ width: '100%', maxWidth: MAIN_CONTENT_MAX_WIDTH, mx: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
export default CollapsiblePushSidebar;