// frontend/src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast'; // Импортируем toast для уведомлений


const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Изначально user - undefined, чтобы мы могли показать загрузку, пока идет проверка
  const [user, setUser] = useState(undefined);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // --- ИЗМЕНЕНИЕ ЗДЕСЬ: Эффект для проверки токена и профиля ---
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            throw new Error("Token expired");
          }

          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Делаем запрос на бэкенд за актуальным профилем
          const response = await axios.get('/auth/profile');

          // Сохраняем полный объект пользователя из ответа API
          setUser(response.data);
          setAuthToken(token);

        } catch (error) {
          // Если токен невалиден или профиль не загрузился
          localStorage.removeItem('authToken');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setAuthToken(null);
        }
      } else {
        // Если токена нет, просто устанавливаем user в null
        setUser(null);
      }
    };

    initializeAuth();
  }, []); // Пустой массив зависимостей, чтобы выполнялось один раз при старте

  // ... остальная часть файла (useEffect для сокета, login, logout) остается без изменений ...
  useEffect(() => {
    if (authToken && user && !user.is_banned) {
      if (!socketRef.current) {
        console.log('AuthProvider: Connecting socket...');
        const newSocket = io(process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000', {
          transports: ['websocket'],
          auth: { token: authToken },
        });

        // --- НОВЫЙ СЛУШАТЕЛЬ СОБЫТИЯ ---
        newSocket.on('linkStatus', (data) => {
            if (data.success) {
                toast.success(`Successfully linked to Minecraft account: ${data.minecraftUsername}!`);
                // Обновляем объект пользователя в контексте
                setUser(prevUser => ({ ...prevUser, minecraft_username: data.minecraftUsername, minecraft_uuid: 'linked' }));
            } else {
                toast.error(`Linking failed: ${data.error}`);
            }
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
      }
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    }
    return () => {
        // Убираем слушатель при отключении
        if(socketRef.current) {
            socketRef.current.off('linkStatus');
        }
    }
  }, [authToken, user]);

  const login = useCallback(async (token) => {
    localStorage.setItem('authToken', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      // После логина сразу запрашиваем актуальный профиль
      const response = await axios.get('/auth/profile');
      setUser(response.data);
      setAuthToken(token);
    } catch (error) {
      // Обработка ошибки, если профиль не загрузился
      logout();
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    setAuthToken(null);
    setUser(null);
  }, []);

  const updateAuthToken = useCallback((token) => {
    login(token);
  }, [login]);

  const value = useMemo(() => ({
    // Теперь `user` может быть undefined, null или объектом
    isLoggedIn: !!user,
    user,
    authToken,
    socket,
    login,
    logout,
    updateAuthToken,
  }), [user, authToken, socket, login, logout, updateAuthToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};