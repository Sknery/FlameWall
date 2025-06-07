import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/joy';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();

  // Пока мы не знаем, залогинен ли пользователь (например, при первой загрузке),
  // можно показывать индикатор загрузки. `user` станет `null` или объектом после проверки токена в AuthContext.
  if (user === undefined) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isLoggedIn) {
    // Если пользователь не авторизован, перенаправляем его на страницу входа.
    // Мы также сохраняем путь, на который он пытался зайти, чтобы после входа вернуть его обратно.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Если пользователь авторизован, показываем запрошенную страницу.
  return children;
};

export default ProtectedRoute;