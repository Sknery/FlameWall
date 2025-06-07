import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom'; // Используем NavLink для единообразия
import axios from 'axios';
import { Sheet, Typography, FormControl, FormLabel, Input, Button, Link, Alert } from '@mui/joy';
import { useAuth } from '../context/AuthContext'; // ИСПРАВЛЕННЫЙ ПУТЬ И РЕГИСТР

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      login(response.data.access_token);
      
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      sx={{
        display: 'flex',
        flexFlow: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <Sheet
        sx={{
          width: 400,
          mx: 'auto',
          my: 4,
          py: 3,
          px: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          borderRadius: 'sm',
          boxShadow: 'md',
        }}
        variant="outlined"
      >
        <div>
          <Typography level="h4" component="h1">
            <b>Welcome back!</b>
          </Typography>
          <Typography level="body-sm">Sign in to continue.</Typography>
        </div>

        {error && <Alert color="danger">{error}</Alert>}
        
        <form onSubmit={handleLogin}>
          <FormControl required>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>
          <FormControl required>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          <Button type="submit" loading={loading} sx={{ mt: 2, mb: 1 }} fullWidth>
            Log in
          </Button>
        </form>
        <Typography
          endDecorator={<Link component={NavLink} to="/register">Sign up</Link>}
          fontSize="sm"
          sx={{ alignSelf: 'center' }}
        >
          Don&apos;t have an account?
        </Typography>
      </Sheet>
    </Sheet>
  );
}

export default LoginPage;