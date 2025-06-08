import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import axios from 'axios';
import { Sheet, Typography, FormControl, FormLabel, Input, Button, Link, Alert } from '@mui/joy';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log(`%c[LoginPage] useEffect: Запустился. isLoggedIn: ${isLoggedIn}`, 'color: gray');
    if (isLoggedIn) {
      console.log('%c[LoginPage] useEffect: Пользователь залогинен. Перенаправляю на главную...', 'color: gray; font-weight: bold');
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      console.log('%c[LoginPage] handleLogin: Отправляю запрос на /auth/login...', 'color: teal');
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      
      console.log('%c[LoginPage] handleLogin: Ответ получен. Вызываю login() из контекста...', 'color: teal; font-weight: bold');
      login(response.data.access_token);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <Sheet sx={{ display: 'flex', flexFlow: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Sheet sx={{ width: 400, mx: 'auto', my: 4, py: 3, px: 4, display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 'sm', boxShadow: 'md' }} variant="outlined">
        <div><Typography level="h4" component="h1"><b>Welcome back!</b></Typography><Typography level="body-sm">Sign in to continue.</Typography></div>
        {error && <Alert color="danger">{error}</Alert>}
        <form onSubmit={handleLogin}>
          <FormControl required><FormLabel>Email</FormLabel><Input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}/></FormControl>
          <FormControl required><FormLabel>Password</FormLabel><Input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}/></FormControl>
          <Button type="submit" loading={loading} sx={{ mt: 2, mb: 1 }} fullWidth>Log in</Button>
        </form>
        <Typography endDecorator={<Link component={NavLink} to="/register">Sign up</Link>} fontSize="sm" sx={{ alignSelf: 'center' }}>Don&apos;t have an account?</Typography>
      </Sheet>
    </Sheet>
  );
}

export default LoginPage;