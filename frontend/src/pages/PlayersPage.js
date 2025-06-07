import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Typography,
  CircularProgress,
  Alert,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  AspectRatio,
} from '@mui/joy';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function PlayersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/users`);
        setUsers(response.data);
      } catch (err) {
        setError('Failed to load players list.');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size="lg" /></Box>;
  }

  if (error) {
    return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Typography level="h1" component="h1" sx={{ mb: 3 }}>
        Community Players
      </Typography>
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        {users.map((user) => (
          <Grid xs={12} sm={6} md={4} key={user.id}>
            <Card
              variant="outlined"
              component={RouterLink}
              to={`/users/${user.id}`} // Ссылка на будущую публичную страницу профиля
              sx={{ 
                textDecoration: 'none',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 'md',
                }
              }}
            >
              {user.banner_url && (
                <AspectRatio ratio="2">
                  <img src={user.banner_url} alt={`${user.username}'s banner`} loading="lazy" />
                </AspectRatio>
              )}
              <CardContent sx={{ mt: user.banner_url ? 0 : 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={user.pfp_url}
                  sx={{ '--Avatar-size': '60px', border: '2px solid', borderColor: 'background.body' }}
                />
                <Box>
                  <Typography level="title-lg">{user.username}</Typography>
                  <Chip size="sm" color="primary" sx={{ mt: 0.5 }}>{user.rank}</Chip>
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