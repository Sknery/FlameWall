import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
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
} from '@mui/joy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function FriendsPage() {
  const { authToken } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    setError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const [friendsResponse, requestsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/friendships`, config),
        axios.get(`${API_BASE_URL}/friendships/requests/pending`, config),
      ]);
      setFriends(friendsResponse.data);
      setPendingRequests(requestsResponse.data);
    } catch (err) {
      setError('Failed to load friends data.');
      console.error('Error fetching friends data:', err);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleRequestAction = async (action, requestId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      if (action === 'accept') {
        await axios.patch(`${API_BASE_URL}/friendships/requests/${requestId}/accept`, {}, config);
      } else if (action === 'reject') {
        await axios.delete(`${API_BASE_URL}/friendships/requests/${requestId}`, config);
      }
      fetchData();
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
    }
  };
  
  const handleRemoveFriend = async (friendshipId) => {
    try {
      await axios.delete(`${API_BASE_URL}/friendships/${friendshipId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      fetchData();
    } catch (err) {
      console.error('Failed to remove friend:', err);
    }
  };


  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size="lg" /></Box>;
  }

  if (error) {
    return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Typography level="h1" component="h1" sx={{ mb: 3 }}>My Friends</Typography>
      <Tabs aria-label="Friends and requests tabs" defaultValue={0}>
        <TabList>
          <Tab>Friends ({friends.length})</Tab>
          <Tab>
            Friend Requests
            {pendingRequests.length > 0 && <Chip size="sm" color="danger" sx={{ ml: 1 }}>{pendingRequests.length}</Chip>}
          </Tab>
        </TabList>
        <TabPanel value={0}>
          <List>
            {friends.length > 0 ? friends.map(item => (
              <ListItem key={item.friendshipId}
                endAction={
                  <IconButton variant="plain" color="danger" onClick={() => handleRemoveFriend(item.friendshipId)}>
                    <PersonRemoveIcon />
                  </IconButton>
                }
              >
                {/* ИСПРАВЛЕНИЕ ЗДЕСЬ: используем item.user.id и другие поля из вложенного объекта user */}
                <ListItemButton component={RouterLink} to={`/users/${item.user.id}`}>
                  <ListItemDecorator><Avatar src={item.user.pfp_url} /></ListItemDecorator>
                  <ListItemContent>{item.user.username}</ListItemContent>
                </ListItemButton>
              </ListItem>
            )) : <Typography sx={{ mt: 2 }}>Your friends list is empty.</Typography>}
          </List>
        </TabPanel>
        <TabPanel value={1}>
          <List>
            {pendingRequests.length > 0 ? pendingRequests.map(req => (
              <ListItem key={req.id}
                endAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton variant="solid" color="success" onClick={() => handleRequestAction('accept', req.id)}><CheckCircleIcon /></IconButton>
                    <IconButton variant="solid" color="danger" onClick={() => handleRequestAction('reject', req.id)}><CancelIcon /></IconButton>
                  </Box>
                }
              >
                {/* И здесь используем req.requester.id, req.requester.pfp_url и т.д. */}
                <ListItemButton component={RouterLink} to={`/users/${req.requester.id}`}>
                  <ListItemDecorator><Avatar src={req.requester.pfp_url} /></ListItemDecorator>
                  <ListItemContent>
                    <Typography>{req.requester.username}</Typography>
                    <Typography level="body-xs">Wants to be your friend</Typography>
                  </ListItemContent>
                </ListItemButton>
              </ListItem>
            )) : <Typography sx={{ mt: 2 }}>No pending friend requests.</Typography>}
          </List>
        </TabPanel>
      </Tabs>
    </Box>
  );
}

export default FriendsPage;