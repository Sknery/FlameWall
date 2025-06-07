import React, { useState } from 'react';
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
  Input
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
    { name: 'Friends', icon: <GroupAddIcon />, path: '/profile/friends' },
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

  const isLoggedIn = true; 
  const isAdmin = true; 

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCategory = (categoryName) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };
  
  const renderNavItems = (items) => {
    return items.map((item) => (
      <ListItem key={item.name} nested={!!item.subItems}>
        <ListItemButton
          onClick={() => item.subItems ? toggleCategory(item.name) : console.log(`Maps to ${item.path}`)}
        >
          {item.icon && <ListItemDecorator>{item.icon}</ListItemDecorator>}
          <ListItemContent>{item.name}</ListItemContent>
          {item.subItems && (openCategories[item.name] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />)}
        </ListItemButton>
        {item.subItems && openCategories[item.name] && (
          <List sx={{ '--List-nestedInsetStart': '20px', pt: 0.5 }}>
            {item.subItems.map((subItem) => (
              <ListItem key={subItem.name}>
                <ListItemButton onClick={() => console.log(`Maps to ${subItem.path}`)}>
                  {subItem.icon && <ListItemDecorator sx={{ color: 'text.tertiary' }}>{subItem.icon}</ListItemDecorator>}
                  <ListItemContent>{subItem.name}</ListItemContent>
                </ListItemButton>
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
          overflowX: 'hidden',
          overflowY: 'auto',
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
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AdbIcon sx={{ fontSize: 'xl2', color: 'primary.plainColor' }} />
                <Typography component="h2" fontWeight="lg">
                  FlameWall
                </Typography>
              </Box>
              <IconButton
                onClick={toggleSidebar}
                variant="plain"
                color="neutral"
                size="sm"
              >
                <ChevronLeftIcon />
              </IconButton>
            </Box>
            
            <List sx={{ '--List-nestedInsetStart': '20px' }}>
              {renderNavItems(navItems)}
              {isLoggedIn && renderNavItems([userNavItems])}
              {isLoggedIn && isAdmin && renderNavItems([adminNavItem])}
            </List>
          </>
        )}
      </Sheet>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4, 
            height: LARGE_ICON_BUTTON_HEIGHT,
            px: { xs: 0, sm: 1 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
            {!sidebarOpen && (
              <IconButton
                onClick={toggleSidebar}
                variant="plain"
                color="neutral"
                size="lg"
              >
                <ChevronRightIcon />
              </IconButton>
            )}
            <Input
              size="md" 
              placeholder="Search..."
              startDecorator={<SearchIcon />}
              sx={{
                width: { xs: '100px', sm: '150px', md: '200px' },
                display: { xs: 'none', sm: 'inline-flex' }
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: {xs: 0.5, sm: 1.5}, alignItems: 'center', flexShrink: 0 }}>
            {isLoggedIn ? (
               <Button
                variant="plain"
                color="neutral"
                size="md" 
                onClick={() => console.log('Logout button clicked')}
                startDecorator={<AccountCircleIcon />}
              >
                Sknery
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  color="neutral"
                  size="md" 
                  onClick={() => console.log('Login button clicked')}
                >
                  Login
                </Button>
                <Button
                  variant="solid"
                  color="primary"
                  size="md"
                  onClick={() => console.log('Register button clicked')}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            width: '100%',
            maxWidth: MAIN_CONTENT_MAX_WIDTH,
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default CollapsiblePushSidebar;