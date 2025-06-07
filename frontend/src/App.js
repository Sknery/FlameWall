import React from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import monochromeDarkTheme from './theme';
import MainLayout from './layouts/MainLayout'; 
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import NewsPage from './pages/NewsPage';
import PostsPage from './pages/PostsPage';
import SinglePostPage from './pages/SinglePostPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyProfilePage from './pages/MyProfilePage';
import PlayersPage from './pages/PlayersPage';
import PublicProfilePage from './pages/PublicProfilePage'; // <-- Импортируем новую страницу

// ... импорты ...
import FriendsPage from './pages/FriendsPage'; // <-- Импортируем

function App() {
  return (
    <CssVarsProvider theme={monochromeDarkTheme} defaultMode="dark">
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="news" element={<NewsPage />} />
              <Route path="posts" element={<PostsPage />} />
              <Route path="posts/:postId" element={<SinglePostPage />} />
              <Route path="players" element={<PlayersPage />} />
              <Route path="users/:userId" element={<PublicProfilePage />} />
              
              <Route 
                path="/profile/me" 
                element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} 
              />
              <Route 
                path="/profile/friends" // <-- Добавлен этот роут
                element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} 
              />
            </Route>
            
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </CssVarsProvider>
  );
}

export default App;