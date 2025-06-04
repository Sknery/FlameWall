import React, { useState } from 'react';
import Box from '@mui/joy/Box';
import Sheet from '@mui/joy/Sheet';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import ListItemContent from '@mui/joy/ListItemContent';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import ArticleIcon from '@mui/icons-material/Article';
import StorageIcon from '@mui/icons-material/Storage';
import GavelIcon from '@mui/icons-material/Gavel';
import MapIcon from '@mui/icons-material/Map';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/Group';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import ForumIcon from '@mui/icons-material/Forum';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import DiamondIcon from '@mui/icons-material/Diamond';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCardIcon from '@mui/icons-material/AddCard';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AdbIcon from '@mui/icons-material/Adb';

const SIDEBAR_WIDTH = 280;
const MAIN_CONTENT_MAX_WIDTH = '1000px';
const LARGE_ICON_BUTTON_HEIGHT = '48px';

const navItems = [
  { name: 'Home', icon: <HomeIcon />, path: '/' },
  { name: 'News', icon: <ArticleIcon />, path: '/news' },
  {
    name: 'Server',
    icon: <StorageIcon />,
    subItems: [
      { name: 'Information', icon: <InfoIcon />, path: '/server/info' },
      { name: 'Rules', icon: <GavelIcon />, path: '/server/rules' },
      { name: 'Live Map', icon: <MapIcon />, path: '/server/map' },
      { name: 'Staff Team', icon: <SupervisorAccountIcon />, path: '/server/staff' },
    ],
  },
  {
    name: 'My Profile',
    icon: <AccountCircleIcon />,
    subItems: [
      { name: 'Overview', icon: <PersonIcon />, path: '/profile/me' },
      { name: 'My Stats', icon: <QueryStatsIcon />, path: '/profile/stats' },
      { name: 'Achievements', icon: <EmojiEventsIcon />, path: '/profile/achievements' },
      { name: 'Settings', icon: <SettingsIcon />, path: '/profile/settings' },
    ],
  },
  {
    name: 'Community',
    icon: <PeopleIcon />,
    subItems: [
      { name: 'Players', icon: <GroupIcon />, path: '/community/players' },
      { name: 'Leaderboards', icon: <LeaderboardIcon />, path: '/community/leaderboards' },
      { name: 'Forum', icon: <ForumIcon />, path: '/community/forum' },
    ],
  },
  {
    name: 'Store',
    icon: <StorefrontIcon />,
    subItems: [
      { name: 'Ranks & Perks', icon: <VerifiedUserIcon />, path: '/store/ranks' },
      { name: 'In-Game Items', icon: <DiamondIcon />, path: '/store/items' },
      { name: 'Coin Shop', icon: <CurrencyExchangeIcon />, path: '/store/coins' },
      { name: 'My Balance', icon: <AccountBalanceWalletIcon />, path: '/store/balance' },
      { name: 'Top Up', icon: <AddCardIcon />, path: '/store/top-up' },
    ],
  },
  { name: 'Support', icon: <SupportAgentIcon />, path: '/support' },
];

const CollapsiblePushSidebar = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openCategories, setOpenCategories] = useState({});

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleCategory = (categoryName) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
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
          transition: 'width 0.3s ease-in-out, min-width 0.3s ease-in-out, padding 0.3s ease-in-out, opacity 0.3s ease-in-out, visibility 0.3s ease-in-out',
          boxShadow: sidebarOpen ? 'md' : 'none',
          p: sidebarOpen ? 2 : 0,
          visibility: sidebarOpen ? 'visible' : 'hidden',
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
                <ArticleIcon sx={{ fontSize: 'xl2' }} />
                <Typography component="h2" fontWeight="lg">
                  Navigation
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
            <List
              sx={{
                '--List-nestedInsetStart': '20px',
              }}
            >
              {navItems.map((item) => (
                <ListItem key={item.name} nested={!!item.subItems}>
                  <ListItemButton
                    onClick={() => item.subItems ? toggleCategory(item.name) : console.log(`Maps to ${item.path}`)}
                  >
                    {item.icon && <ListItemDecorator>{item.icon}</ListItemDecorator>}
                    <ListItemContent>{item.name}</ListItemContent>
                    {item.subItems && (openCategories[item.name] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />)}
                  </ListItemButton>
                  {item.subItems && openCategories[item.name] && (
                    <List sx={{ pl: 'var(--List-nestedInsetStart)', pt: 0.5 }}>
                      {item.subItems.map((subItem) => (
                        <ListItem key={subItem.name}>
                          <ListItemButton onClick={() => console.log(`Maps to ${subItem.path}`)}>
                            {subItem.icon && <ListItemDecorator>{subItem.icon}</ListItemDecorator>}
                            <ListItemContent>{subItem.name}</ListItemContent>
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </ListItem>
              ))}
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
              placeholder="Search players..."
              startDecorator={<SearchIcon />}
              sx={{
                width: { xs: '100px', sm: '150px', md: '200px' },
                display: { xs: 'none', sm: 'inline-flex' }
              }}
            />
          </Box>

          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, overflow: 'hidden', px:1 }}>
            <AdbIcon
              color="primary"
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                fontSize: 'xl4',
              }}
            />
            <Typography
              fontWeight="lg"
              level="h3"
              component="div"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
                textAlign: 'center',
              }}
            >
              FlameWall
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: {xs: 0.5, sm: 1.5}, alignItems: 'center', flexShrink: 0 }}>
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