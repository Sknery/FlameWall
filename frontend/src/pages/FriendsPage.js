import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import {
  Typography,
  CircularProgress,
  Alert,
  Box,
  List,
  ListItem,
  ListItemDecorator,
  ListItemContent,
  ListItemButton,
  Avatar,
  IconButton,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Chip,
  Button,
} from '@mui/joy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import UnsubscribeIcon from '@mui/icons-material/Unsubscribe';
import LockOpenIcon from '@mui/icons-material/LockOpen';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function FriendsPage() {
  const { authToken } = useAuth();
  const { friendshipUpdateTrigger } = useNotifications();

  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    setError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const [friendsRes, pendingRes, outgoingRes, blockedRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/friendships`, config),
        axios.get(`${API_BASE_URL}/friendships/requests/pending`, config),
        axios.get(`${API_BASE_URL}/friendships/requests/outgoing`, config),
        axios.get(`${API_BASE_URL}/friendships/blocked`, config),
      ]);
      setFriends(friendsRes.data);
      setPendingRequests(pendingRes.data);
      setOutgoingRequests(outgoingRes.data);
      setBlockedUsers(blockedRes.data);
    } catch (err) {
      setError('Failed to load friends data.');
      console.error('Error fetching friends data:', err);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData, friendshipUpdateTrigger]);
  
  const handleRequestAction = async (action, requestId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      if (action === 'accept') {
        await axios.patch(`${API_BASE_URL}/friendships/requests/${requestId}/accept`, {}, config);
      } else if (action === 'reject' || action === 'cancel') {
        await axios.delete(`${API_BASE_URL}/friendships/requests/${requestId}`, config);
      }
      fetchData();
    } catch (err) { console.error(`Failed to ${action} request:`, err); }
  };
  
  const handleRemoveFriend = async (friendshipId) => {
    try {
      await axios.delete(`${API_BASE_URL}/friendships/${friendshipId}`, { headers: { Authorization: `Bearer ${authToken}` } });
      fetchData();
    } catch (err) { console.error('Failed to remove friend:', err); }
  };
  
  const handleUnblock = async (userIdToUnblock) => {
    try {
        // --- ИСПРАВЛЕНО: Заменяем API__URL на API_BASE_URL ---
      await axios.delete(`${API_BASE_URL}/friendships/block/${userIdToUnblock}`, { headers: { Authorization: `Bearer ${authToken}` } });
      fetchData();
    } catch(err) { console.error('Failed to unblock user:', err); }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size="lg" /></Box>;
  }

  if (error) {
    return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Typography level="h1" component="h1" sx={{ mb: 3 }}>Manage Friendships</Typography>
      <Tabs aria-label="Friendship management tabs" defaultValue={0}>
        <TabList>
          <Tab>Friends ({friends.length})</Tab>
          <Tab>
            Incoming Requests
            {pendingRequests.length > 0 && <Chip size="sm" color="danger" sx={{ ml: 1 }}>{pendingRequests.length}</Chip>}
          </Tab>
          <Tab>Outgoing Requests ({outgoingRequests.length})</Tab>
          <Tab>Blocked ({blockedUsers.length})</Tab>
        </TabList>

        <TabPanel value={0}> {/* Friends */}
          <List>{friends.length > 0 ? friends.map(item => ( <ListItem key={item.friendshipId} endAction={<IconButton variant="plain" color="danger" onClick={() => handleRemoveFriend(item.friendshipId)}><PersonRemoveIcon /></IconButton>}><ListItemButton component={RouterLink} to={`/users/${item.user.id}`}><ListItemDecorator><Avatar src={item.user.pfp_url} /></ListItemDecorator><ListItemContent>{item.user.username}</ListItemContent></ListItemButton></ListItem>)) : <Typography sx={{mt: 2}}>Your friends list is empty.</Typography>}</List>
        </TabPanel>

        <TabPanel value={1}> {/* Incoming Requests */}
          <List>{pendingRequests.length > 0 ? pendingRequests.map(req => (<ListItem key={req.id} endAction={<Box sx={{ display: 'flex', gap: 1 }}><IconButton variant="solid" color="success" onClick={() => handleRequestAction('accept', req.id)}><CheckCircleIcon /></IconButton><IconButton variant="solid" color="danger" onClick={() => handleRequestAction('reject', req.id)}><CancelIcon /></IconButton></Box>}><ListItemButton component={RouterLink} to={`/users/${req.requester.id}`}><ListItemDecorator><Avatar src={req.requester.pfp_url} /></ListItemDecorator><ListItemContent><Typography>{req.requester.username}</Typography><Typography level="body-xs">Wants to be your friend</Typography></ListItemContent></ListItemButton></ListItem>)) : <Typography sx={{mt: 2}}>No pending friend requests.</Typography>}</List>
        </TabPanel>
        
        <TabPanel value={2}> {/* Outgoing Requests */}
            <List>{outgoingRequests.length > 0 ? outgoingRequests.map(req => (<ListItem key={req.id} endAction={<Button variant="outlined" color="neutral" size="sm" startDecorator={<UnsubscribeIcon />} onClick={() => handleRequestAction('cancel', req.id)}>Cancel</Button>}><ListItemButton component={RouterLink} to={`/users/${req.receiver.id}`}><ListItemDecorator><Avatar src={req.receiver.pfp_url} /></ListItemDecorator><ListItemContent><Typography>Request sent to {req.receiver.username}</Typography></ListItemContent></ListItemButton></ListItem>)) : <Typography sx={{mt: 2}}>You have no outgoing friend requests.</Typography>}</List>
        </TabPanel>

        <TabPanel value={3}> {/* Blocked Users */}
            <List>{blockedUsers.length > 0 ? blockedUsers.map(item => (<ListItem key={item.id} endAction={<Button variant="solid" color="warning" size="sm" startDecorator={<LockOpenIcon />} onClick={() => handleUnblock(item.receiver.id)}>Unblock</Button>}><ListItemButton component={RouterLink} to={`/users/${item.receiver.id}`}><ListItemDecorator><Avatar src={item.receiver.pfp_url} /></ListItemDecorator><ListItemContent>{item.receiver.username}</ListItemContent></ListItemButton></ListItem>)) : <Typography sx={{mt: 2}}>You have not blocked any users.</Typography>}</List>
        </TabPanel>
      </Tabs>
    </Box>
  );
}

export default FriendsPage;