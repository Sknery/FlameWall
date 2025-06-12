// frontend/src/pages/PlayersPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Typography, CircularProgress, Alert, Box, Grid, Card, CardContent, Avatar, Chip, AspectRatio,
  FormControl, FormLabel, Select, Option, Stack
} from '@mui/joy';
import { constructImageUrl } from '../utils/url';
// --- ДОБАВЛЕНО ---
import { useAuth } from '../context/AuthContext';
import CircleIcon from '@mui/icons-material/Circle';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function PlayersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('first_login');
  const [order, setOrder] = useState('DESC');
  
  // --- ДОБАВЛЕНО: Получаем сокет из контекста ---
  const { socket } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/users`, {
        params: { sortBy, order }
      });
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load players list.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [sortBy, order]);

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [fetchUsers]);

  // --- ДОБАВЛЕНО: Слушатель для обновления статусов в реальном времени ---
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data) => {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === data.userId 
            ? { ...user, is_minecraft_online: data.is_minecraft_online } 
            : user
        )
      );
    };

    socket.on('userStatusUpdate', handleStatusUpdate);

    return () => {
      socket.off('userStatusUpdate', handleStatusUpdate);
    };
  }, [socket]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size="lg" /></Box>;
  }

  if (error) {
    return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Typography level="h1" component="h1" sx={{ mb: 3 }}>Community Players</Typography>
      
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <FormControl size="sm">
          <FormLabel>Sort by</FormLabel>
          <Select value={sortBy} onChange={(e, newValue) => setSortBy(newValue)}>
            <Option value="first_login">Join Date</Option>
            <Option value="reputation_count">Reputation</Option>
            <Option value="username">Username</Option>
          </Select>
        </FormControl>
        <FormControl size="sm">
          <FormLabel>Order</FormLabel>
          <Select value={order} onChange={(e, newValue) => setOrder(newValue)}>
            <Option value="DESC">Descending</Option>
            <Option value="ASC">Ascending</Option>
          </Select>
        </FormControl>
      </Stack>

      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        {users.map((user) => (
          <Grid xs={12} sm={6} md={4} key={user.id}>
            <Card
              variant="outlined"
              component={RouterLink}
              to={`/users/${user.profile_slug || user.id}`}
              sx={{ textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 'md' } }}
            >
              {user.banner_url && (
                <AspectRatio ratio="2">
                  <img src={constructImageUrl(user.banner_url)} alt={`${user.username}'s banner`} loading="lazy" />
                </AspectRatio>
              )}
              <CardContent sx={{ mt: user.banner_url ? 0 : 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={constructImageUrl(user.pfp_url)} sx={{ '--Avatar-size': '60px', border: '2px solid', borderColor: 'background.body' }}/>
                <Box>
                  <Typography level="title-lg">{user.username}</Typography>
                  {/* --- ИЗМЕНЕНО: Добавляем Stack для чипов --- */}
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip size="sm" color="primary">{user.rank}</Chip>
                    {user.minecraft_username && (
                      <Chip
                        size="sm"
                        variant="soft"
                        color={user.is_minecraft_online ? 'success' : 'neutral'}
                        startDecorator={<CircleIcon sx={{ fontSize: '10px' }} />}
                      >
                        {user.is_minecraft_online ? 'Online' : 'Offline'}
                      </Chip>
                    )}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default PlayersPage;