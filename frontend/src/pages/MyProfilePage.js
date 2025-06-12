// frontend/src/pages/MyProfilePage.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Box, Typography, Sheet, Avatar, CircularProgress, Alert, Divider, Button, Chip, Stack,
} from '@mui/joy';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { Link as RouterLink } from 'react-router-dom';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'; // <-- Иконка для Minecraft
import { constructImageUrl } from '../utils/url';
import CircleIcon from '@mui/icons-material/Circle';


function MyProfilePage() {
  // --- ИЗМЕНЕНИЕ: Достаем полный объект user из useAuth ---
  const { user: profile, loading: authLoading, error: authError, socket, updateAuthToken } = useAuth();

  // Локальное состояние для ошибок, если понадобится
  const [error, setError] = useState(authError);

  // Больше не нужен отдельный fetch, все данные уже в `user` из AuthContext
  const loading = authLoading;

  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data) => {
      // Мы обновляем только статус, а не весь объект пользователя,
      // чтобы не вызывать лишних перерисовок и не запрашивать новый токен
      if (profile && data.userId === profile.id) {
        // Имитируем обновление токена, чтобы данные в useAuth обновились
        // Это простой способ, можно реализовать и сложнее через отдельную функцию в контексте
        const newToken = localStorage.getItem('authToken');
        if (newToken) {
          updateAuthToken(newToken);
        }
      }
    };

    socket.on('userStatusUpdate', handleStatusUpdate);

    return () => {
      socket.off('userStatusUpdate', handleStatusUpdate);
    };
  }, [socket, profile, updateAuthToken]);

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
          <Avatar src={constructImageUrl(profile.pfp_url)} sx={{ '--Avatar-size': '100px' }} />
          <Box>
            <Typography level="h2" component="h1">{profile.username}</Typography>
            {profile.profile_slug && (
              <Typography level="body-md" textColor="text.tertiary">
                @{profile.profile_slug}
              </Typography>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip size="sm" color="primary">{profile.rank}</Chip>
              <Chip size="sm" color="neutral" variant="outlined" startDecorator={<ThumbUpOffAltIcon />}>
                Reputation: {profile.reputation_count}
              </Chip>
              {/* --- НОВЫЙ БЛОК: Отображение ника из Minecraft --- */}
              {profile.minecraft_username && (
                <Chip
                  size="sm"
                  variant="soft"
                  color={profile.is_minecraft_online ? 'success' : 'neutral'}
                  startDecorator={
                    <CircleIcon sx={{ fontSize: '10px' }} />
                  }
                >
                  {profile.minecraft_username} ({profile.is_minecraft_online ? 'Online' : 'Offline'})
                </Chip>
              )}
            </Stack>
          </Box>
          <Stack spacing={1} direction="row" sx={{ ml: 'auto' }}>
            <Button component={RouterLink} to="/posts/new" variant="solid" color="primary" startDecorator={<AddIcon />}>
              New Post
            </Button>
            <Button component={RouterLink} to="/profile/settings" variant="outlined" color="neutral" startDecorator={<EditIcon />}>
              Edit Profile
            </Button>
          </Stack>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography level="body-lg">
          {profile.description || 'No description provided.'}
        </Typography>
      </Sheet>
    </Box>
  );
}

export default MyProfilePage;