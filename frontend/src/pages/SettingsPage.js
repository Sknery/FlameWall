import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Box, Typography, FormControl, FormLabel, Input, Button, Alert,
  CircularProgress, Sheet, Divider, Textarea, Stack, Avatar, AspectRatio,
} from '@mui/joy';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link'; // <-- ИЗМЕНЕНИЕ: Добавляем импорт иконки
import { useNavigate } from 'react-router-dom';
import { constructImageUrl } from '../utils/url';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
const FULL_API_URL = process.env.REACT_APP_FULL_API_URL || 'http://localhost:3000';

function SettingsPage() {
  // --- ИЗМЕНЕНИЕ: Добавляем 'user' из useAuth ---
  const { authToken, updateAuthToken, user } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({ username: '', profile_slug: '', description: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authToken) return;
      try {
        setLoading(true);
        // Используем user из useAuth(), чтобы не делать лишний запрос
        if (user) {
          setProfileData({
            username: user.username || '',
            profile_slug: user.profile_slug || '',
            description: user.description || '',
          });
          setAvatarPreview(user.pfp_url);
          setBannerPreview(user.banner_url);
        }
      } catch (err) {
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authToken, user]); // Добавляем user в зависимости

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (type === 'avatar') {
      setAvatarFile(file);
      setAvatarPreview(previewUrl);
    } else {
      setBannerFile(file);
      setBannerPreview(previewUrl);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const promises = [];
      
      promises.push(axios.patch('/users/me', profileData, {
        headers: { Authorization: `Bearer ${authToken}` },
      }));

      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        promises.push(axios.post('/users/me/avatar', formData, {
          headers: { Authorization: `Bearer ${authToken}` },
        }));
      }
      
      if (bannerFile) {
        const formData = new FormData();
        formData.append('file', bannerFile);
        promises.push(axios.post('/users/me/banner', formData, {
          headers: { Authorization: `Bearer ${authToken}` },
        }));
      }

      const results = await Promise.all(promises);
      
      const profileUpdateResponse = results[0];
      if (profileUpdateResponse && profileUpdateResponse.data.access_token) {
        updateAuthToken(profileUpdateResponse.data.access_token);
      }
      
      setSuccess('Profile saved successfully!');
      setAvatarFile(null);
      setBannerFile(null);

    } catch (err) {
      const message = err.response?.data?.message;
      const errorMessage = Array.isArray(message) ? message.join(', ') : message;
      setError(errorMessage || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await axios.post('/auth/change-password', 
        { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profileData.username) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Stack spacing={4}>
      <Typography level="h1">Account Settings</Typography>
      <Sheet variant="outlined" sx={{ p: 4, borderRadius: 'md' }}>
        <form onSubmit={handleProfileSubmit}>
          <Typography level="h3" component="h2" sx={{ mb: 2 }}>Edit Profile</Typography>
          {error && <Alert color="danger" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert color="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Stack spacing={3}>
            <FormControl>
              <FormLabel>Profile Picture</FormLabel>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={avatarPreview?.startsWith('blob:') ? avatarPreview : (avatarPreview ? constructImageUrl(avatarPreview): undefined)} sx={{ '--Avatar-size': '80px' }} />
                <Button startDecorator={<EditIcon />} variant="outlined" onClick={() => avatarInputRef.current.click()}>
                  Upload
                </Button>
                <input type="file" accept="image/*" hidden ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} />
              </Stack>
            </FormControl>
            <FormControl>
              <FormLabel>Profile Banner</FormLabel>
              <AspectRatio ratio="16/5" sx={{ width: '100%', borderRadius: 'md', mb: 1, bgcolor: 'background.level1' }}>
                {bannerPreview ? 
                    <img src={bannerPreview?.startsWith('blob:') ? bannerPreview : constructImageUrl(bannerPreview)} alt="Banner"/>
                    : <Box component="div" />
                }
              </AspectRatio>
              <Button startDecorator={<EditIcon />} variant="outlined" onClick={() => bannerInputRef.current.click()} sx={{ alignSelf: 'flex-start' }}>
                Upload Banner
              </Button>
              <input type="file" accept="image/*" hidden ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} />
            </FormControl>
            <Divider />
            <FormControl>
              <FormLabel>Username</FormLabel>
              <Input name="username" value={profileData.username} onChange={handleProfileChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Profile Slug (@your-name)</FormLabel>
              <Input name="profile_slug" value={profileData.profile_slug} onChange={handleProfileChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea name="description" value={profileData.description} onChange={handleProfileChange} minRows={3} />
            </FormControl>
            <Button type="submit" loading={loading} sx={{ mt: 1, alignSelf: 'flex-start' }}>Save All Changes</Button>
          </Stack>
        </form>
      </Sheet>

      <Sheet variant="outlined" sx={{ p: 4, borderRadius: 'md' }}>
          <Typography level="h3" component="h2" sx={{ mb: 2 }}>Minecraft Integration</Typography>
          {user?.minecraft_uuid ? (
            <Box>
                <Typography>Your account is linked to Minecraft account: <strong>{user.minecraft_username}</strong></Typography>
                <Button sx={{mt: 2}} variant="outlined" color="neutral" onClick={() => navigate('/profile/link-minecraft')}>Manage</Button>
            </Box>
          ) : (
            <Box>
                <Typography>Link your Minecraft account to sync your status and more.</Typography>
                <Button sx={{mt: 2}} startDecorator={<LinkIcon />} onClick={() => navigate('/profile/link-minecraft')}>Link Account</Button>
            </Box>
          )}
      </Sheet>

      <Sheet variant="outlined" sx={{ p: 4, borderRadius: 'md' }}>
        <Typography level="h3" component="h2" sx={{ mb: 2 }}>Change Password</Typography>
        <form onSubmit={handlePasswordSubmit}>
          <Stack spacing={2}>
            {passwordError && <Alert color="danger">{passwordError}</Alert>}
            {passwordSuccess && <Alert color="success">{passwordSuccess}</Alert>}
            <FormControl required>
              <FormLabel>Current Password</FormLabel>
              <Input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} />
            </FormControl>
            <FormControl required>
              <FormLabel>New Password</FormLabel>
              <Input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} />
            </FormControl>
            <FormControl required>
              <FormLabel>Confirm New Password</FormLabel>
              <Input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
            </FormControl>
            <Button type="submit" loading={loading} sx={{ mt: 1, alignSelf: 'flex-start' }}>Change Password</Button>
          </Stack>
        </form>
      </Sheet>
    </Stack>
  );
}

export default SettingsPage;