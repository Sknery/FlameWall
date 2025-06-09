import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
// --- ИЗМЕНЕНО: Добавляем Stack и иконку для новой кнопки ---
import { Box, Typography, Sheet, Avatar, CircularProgress, Alert, Divider, Button, Chip, Dropdown, Menu, MenuButton, MenuItem, Stack } from '@mui/joy';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BlockIcon from '@mui/icons-material/Block';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import MailIcon from '@mui/icons-material/Mail';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user: currentUser, authToken } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendship, setFriendship] = useState({ status: 'loading' });

  const fetchProfileAndStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      // Преобразуем идентификатор в число, если это возможно
      const idAsNumber = parseInt(userId, 10);
      const identifier = isNaN(idAsNumber) ? userId : idAsNumber;

      const profileResponse = await axios.get(`${API_BASE_URL}/users/${identifier}`, config);
      setProfile(profileResponse.data);

      if (isLoggedIn && currentUser?.id !== profileResponse.data.id) {
        const statusResponse = await axios.get(`${API_BASE_URL}/friendships/status/${profileResponse.data.id}`, config);
        setFriendship(statusResponse.data);
      } else if (currentUser?.id === profileResponse.data.id) {
        setFriendship({ status: 'self' });
      } else {
        setFriendship({ status: 'guest' });
      }

    } catch (err) {
      setError('Failed to load user profile.');
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, authToken, isLoggedIn, currentUser?.id]);

  useEffect(() => {
    fetchProfileAndStatus();
  }, [fetchProfileAndStatus]);

  const handleAction = async (action) => {
    const config = { headers: { Authorization: `Bearer ${authToken}` } };
    try {
      switch (action) {
        case 'add':
          await axios.post(`${API_BASE_URL}/friendships/requests`, { receiverId: profile.id }, config);
          break;
        case 'accept':
          await axios.patch(`${API_BASE_URL}/friendships/requests/${friendship.requestId}/accept`, {}, config);
          break;
        case 'reject':
          await axios.delete(`${API_BASE_URL}/friendships/requests/${friendship.requestId}`, config);
          break;
        case 'cancel':
          alert("Cancel request functionality not implemented yet.");
          break;
        case 'remove':
          await axios.delete(`${API_BASE_URL}/friendships/${friendship.friendshipId}`, config);
          break;
        case 'block':
          await axios.post(`${API_BASE_URL}/friendships/block/${profile.id}`, {}, config);
          break;
        case 'unblock':
          await axios.delete(`${API_BASE_URL}/friendships/block/${profile.id}`, config);
          break;
        default:
          break;
      }
      fetchProfileAndStatus();
    } catch (err) {
      alert(err.response?.data?.message || 'An error occurred.');
      console.error(`Error performing action ${action}:`, err);
    }
  };

  const renderActionButtons = () => {
    if (!isLoggedIn || friendship.status === 'self') return null;

    // --- ИЗМЕНЕНО: Убрано 'ml: auto' из кнопок, так как родительский Stack теперь управляет выравниванием ---
    switch (friendship.status) {
      case 'ACCEPTED':
        return (
          <Dropdown>
            <MenuButton endDecorator={<MoreVertIcon />} slots={{ root: Button }} slotProps={{ root: { variant: 'soft', color: 'neutral', startDecorator: <HowToRegIcon /> } }}>
              Friends
            </MenuButton>
            <Menu>
              <MenuItem onClick={() => handleAction('remove')}><PersonRemoveIcon /> Remove Friend</MenuItem>
              <MenuItem onClick={() => handleAction('block')} sx={{color: 'danger.500'}}><BlockIcon /> Block User</MenuItem>
            </Menu>
          </Dropdown>
        );
      case 'PENDING_INCOMING':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="success" onClick={() => handleAction('accept')}>Accept</Button>
            <Button color="danger" variant="outlined" onClick={() => handleAction('reject')}>Decline</Button>
          </Box>
        );
      case 'PENDING_OUTGOING':
        return <Button disabled startDecorator={<AccessTimeIcon />}>Request Sent</Button>;
      case 'BLOCKED':
        return <Button color="warning" onClick={() => handleAction('unblock')}>Unblock</Button>;
      case 'NONE':
      default:
        return (
          <Button variant="solid" color="primary" startDecorator={<PersonAddIcon />} onClick={() => handleAction('add')}>
            Add Friend
          </Button>
        );
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size="lg" /></Box>;
  if (error) return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  if (!profile) return <Typography>User not found.</Typography>;

  return (
    <Box>
      <Sheet variant="outlined" sx={{ p: 4, borderRadius: 'md' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Avatar src={profile.pfp_url} sx={{ '--Avatar-size': '100px' }} />
          <Box>
            <Typography level="h2" component="h1">{profile.username}</Typography>
            <Chip
                size="sm"
                color="neutral"
                variant="outlined"
                startDecorator={<ThumbUpOffAltIcon />}
                sx={{ mt: 1 }}
            >
                Reputation: {profile.reputation_count}
            </Chip>
          </Box>
          
          {/* --- ДОБАВЛЕНО: Контейнер для всех кнопок действий --- */}
          <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
            {isLoggedIn && friendship.status !== 'self' && (
              <Button
                variant="solid"
                color="primary"
                startDecorator={<MailIcon />}
                onClick={() => navigate(`/messages/${profile.id}`)}
              >
                Message
              </Button>
            )}
            {renderActionButtons()}
          </Stack>
        </Box>
        <Divider sx={{ my: 2 }}/>
        <Typography level="body-lg">{profile.description || 'No description provided.'}</Typography>
      </Sheet>
    </Box>
  );
}

export default PublicProfilePage;