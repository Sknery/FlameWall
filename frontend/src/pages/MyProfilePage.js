import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Box,
  Typography,
  Sheet,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Chip,
} from '@mui/joy';
import EditIcon from '@mui/icons-material/Edit';
import { Link as RouterLink } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function MyProfilePage() {
  const { authToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authToken) {
      // Если по какой-то причине токена нет, не делаем запрос
      setLoading(false);
      setError("Authorization token not found.");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        // Заголовки авторизации уже должны быть установлены по умолчанию в AuthContext,
        // но для ясности можно их добавить и здесь.
        const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        setProfile(response.data);
      } catch (err) {
        setError("Failed to load profile data.");
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authToken]); // Перезапускаем эффект, если токен изменился (например, после входа)

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size="lg" /></Box>;
  }

  if (error) {
    return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  }

  if (!profile) {
    return <Typography>Could not load profile.</Typography>;
  }

  return (
    <Box>
      <Sheet variant="outlined" sx={{ p: 4, borderRadius: 'md' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Avatar
            src={profile.pfp_url}
            sx={{ '--Avatar-size': '100px' }}
          />
          <Box>
            <Typography level="h2" component="h1">{profile.username}</Typography>
            {profile.profile_slug && (
              <Typography level="body-md" textColor="text.tertiary">
                @{profile.profile_slug}
              </Typography>
            )}
            <Chip size="sm" color="primary" sx={{ mt: 1 }}>{profile.rank}</Chip>
          </Box>
          <Button 
            component={RouterLink} 
            to="/profile/settings"
            variant="outlined" 
            color="neutral" 
            startDecorator={<EditIcon />} 
            sx={{ ml: 'auto' }}
          >
            Edit Profile
          </Button>
        </Box>
        <Divider sx={{ my: 2 }}/>
        <Typography level="body-lg">
          {profile.description || 'No description provided.'}
        </Typography>
      </Sheet>
    </Box>
  );
}

export default MyProfilePage;