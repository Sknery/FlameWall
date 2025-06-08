import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);

  useEffect(() => {
    console.log(`%c[AuthContext] useEffect: Запустился. Токен: ${authToken ? 'ЕСТЬ' : 'НЕТ'}`, 'color: blue');
    if (authToken) {
      try {
        const decodedToken = jwtDecode(authToken);
        if (decodedToken.exp * 1000 < Date.now()) {
          console.log('%c[AuthContext] useEffect: Токен истек, выходим из системы.', 'color: orange');
          logout();
        } else {
          const userData = {
            id: decodedToken.sub,
            username: decodedToken.username,
            rank: decodedToken.rank,
          };
          console.log('%c[AuthContext] useEffect: Токен валиден. Устанавливаю пользователя:', 'color: blue', userData);
          setUser(userData);
          axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        }
      } catch (error) {
        console.error("[AuthContext] useEffect: Невалидный токен.", error);
        logout();
      }
    } else {
        console.log('%c[AuthContext] useEffect: Токен не найден, пользователь - гость.', 'color: blue');
        setUser(null);
    }
  }, [authToken]);

  const login = useCallback((token) => {
    console.log('%c[AuthContext] login: Функция вызвана. Устанавливаю токен.', 'color: green');
    localStorage.setItem('authToken', token);
    setAuthToken(token);
  }, []);

  const logout = useCallback(() => {
    console.log('%c[AuthContext] logout: Функция вызвана. Очищаю токен и пользователя.', 'color: red');
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const value = useMemo(() => ({
    isLoggedIn: !!user,
    user,
    authToken,
    login,
    logout,
  }), [user, authToken, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};