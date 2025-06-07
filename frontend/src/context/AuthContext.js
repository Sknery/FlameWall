import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

// Создаем сам контекст
const AuthContext = createContext(null);

// Создаем "Провайдер" - компонент, который будет хранить состояние и предоставлять его дочерним элементам
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);

  useEffect(() => {
    // Этот эффект запускается один раз при загрузке приложения
    if (authToken) {
      try {
        const decodedToken = jwtDecode(authToken);
        // Проверяем, не истек ли срок действия токена
        if (decodedToken.exp * 1000 < Date.now()) {
          logout(); // Если истек, выходим
        } else {
          // Если токен валиден, устанавливаем данные пользователя и заголовок для axios
          setUser({
            id: decodedToken.sub,
            username: decodedToken.username,
            rank: decodedToken.rank,
          });
          axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        }
      } catch (error) {
        console.error("Invalid token found in localStorage", error);
        logout(); // Если токен невалидный, выходим
      }
    }
  }, [authToken]);

  const login = (token) => {
    localStorage.setItem('authToken', token);
    setAuthToken(token);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Значения, которые мы делаем доступными для всего приложения
  const value = {
    isLoggedIn: !!user,
    user,
    authToken,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Кастомный хук для удобного использования контекста в других компонентах
export const useAuth = () => {
  return useContext(AuthContext);
};