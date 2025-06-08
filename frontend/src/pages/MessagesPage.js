import React, { useState, useEffect } from 'react';
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
} from '@mui/joy';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function MessagesPage() {
  const { authToken } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authToken) return;

    const fetchFriends = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${authToken}` } };
        const response = await axios.get(`${API_BASE_URL}/friendships`, config);
        setFriends(response.data);
      } catch (err) {
        setError('Failed to load contacts.');
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [authToken]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert color="danger">{error}</Alert>;

  return (
    <Box>
      <Typography level="h1" component="h1" sx={{ mb: 3 }}>Messages</Typography>
      <Typography level="body-lg" sx={{ mb: 2 }}>Select a friend to start a conversation.</Typography>
      <List variant="outlined" sx={{ borderRadius: 'sm' }}>
        {friends.length > 0 ? (
          friends.map(item => (
            <ListItem key={item.friendshipId}>
              <ListItemButton component={RouterLink} to={`/messages/${item.user.id}`}>
                <ListItemDecorator><Avatar src={item.user.pfp_url} /></ListItemDecorator>
                <ListItemContent>{item.user.username}</ListItemContent>
              </ListItemButton>
            </ListItem>
          ))
        ) : (
          <Typography sx={{ p: 2 }}>You need to add friends to start a conversation.</Typography>
        )}
      </List>
    </Box>
  );
}

export default MessagesPage;