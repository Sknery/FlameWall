import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);
  
  // Создаем сокет и храним его здесь
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('authToken');
      } else {
        setAuthToken(token);
        setUser({ id: decoded.sub, username: decoded.username, rank: decoded.rank });
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } else {
        setUser(null);
    }
  }, []);

  // Этот эффект управляет жизненным циклом сокета
  useEffect(() => {
    if (authToken) {
        if (!socketRef.current) {
            console.log('AuthProvider: Connecting socket...');
            const newSocket = io(process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000', {
                transports: ['websocket'],
                auth: { token: authToken },
            });
            socketRef.current = newSocket;
            setSocket(newSocket);
        }
    } else {
        if (socketRef.current) {
            console.log('AuthProvider: Disconnecting socket.');
            socketRef.current.disconnect();
            socketRef.current = null;
            setSocket(null);
        }
    }
  }, [authToken]);

  const login = useCallback((token) => {
    localStorage.setItem('authToken', token);
    const decoded = jwtDecode(token);
    setUser({ id: decoded.sub, username: decoded.username, rank: decoded.rank });
    setAuthToken(token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const value = useMemo(() => ({
    isLoggedIn: !!user,
    user,
    authToken,
    socket, // <-- Передаем сокет через AuthContext
    login,
    logout,
  }), [user, authToken, socket, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};