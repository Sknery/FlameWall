import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Box, Typography, FormControl, FormLabel, Input, Button, Alert,
  CircularProgress, Sheet, Divider, Textarea, Stack,
} from '@mui/joy';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function SettingsPage() {
  const { authToken, updateAuthToken } = useAuth();

  // Состояния для формы профиля
  const [profileData, setProfileData] = useState({ username: '', profile_slug: '', description: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Состояния для формы пароля
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
       try {
      // --- ИЗМЕНЕНО: Получаем ответ от сервера ---
      const { data } = await axios.patch(`${API_BASE_URL}/users/me`, profileData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setProfileSuccess('Profile updated successfully!');
      
      // --- ДОБАВЛЕНО: Обновляем токен в приложении ---
      if (data.access_token) {
        updateAuthToken(data.access_token);
      }

    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
    };
    fetchProfile();
  }, [authToken]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await axios.patch(`${API_BASE_URL}/users/me`, profileData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setProfileSuccess('Profile updated successfully!');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await axios.post(`${API_BASE_URL}/auth/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (profileLoading && !profileData.username) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Stack spacing={4}>
      <Typography level="h1">Account Settings</Typography>

      {/* Форма редактирования профиля */}
      <Sheet variant="outlined" sx={{ p: 4, borderRadius: 'md' }}>
        <Typography level="h3" component="h2" sx={{ mb: 2 }}>Edit Profile</Typography>
        <form onSubmit={handleProfileSubmit}>
          <Stack spacing={2}>
            {profileError && <Alert color="danger">{profileError}</Alert>}
            {profileSuccess && <Alert color="success">{profileSuccess}</Alert>}
            <FormControl>
              <FormLabel>Username</FormLabel>
              <Input name="username" value={profileData.username} onChange={handleProfileChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Profile Slug (@username)</FormLabel>
              <Input name="profile_slug" value={profileData.profile_slug} onChange={handleProfileChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea name="description" value={profileData.description} onChange={handleProfileChange} minRows={3} />
            </FormControl>
            <Button type="submit" loading={profileLoading} sx={{ mt: 1, alignSelf: 'flex-start' }}>Save Profile</Button>
          </Stack>
        </form>
      </Sheet>

      {/* Форма смены пароля */}
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
            <Button type="submit" loading={passwordLoading} sx={{ mt: 1, alignSelf: 'flex-start' }}>Change Password</Button>
          </Stack>
        </form>
      </Sheet>
    </Stack>
  );
}

export default SettingsPage;