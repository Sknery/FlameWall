import React from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { Toaster } from 'react-hot-toast';

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
import PublicProfilePage from './pages/PublicProfilePage';
import CreatePostPage from './pages/CreatePostPage';
import FriendsPage from './pages/FriendsPage';
import MessagesPage from './pages/MessagesPage';
import ConversationPage from './pages/ConversationPage';
import EditPostPage from './pages/EditPostPage';
import SettingsPage from './pages/SettingsPage';
import SearchPage from './pages/SearchPage';
import AdminPage from './pages/AdminPage';
import AdminPostsPage from './pages/AdminPostsPage'; // <-- ДОБАВЬТЕ ЭТО

import axios from 'axios'; // <-- Убедитесь, что axios импортирован

axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function App() {
  return (
    <CssVarsProvider theme={monochromeDarkTheme} defaultMode="dark">
      <CssBaseline />
      <AuthProvider>
        <ChatProvider>
          <NotificationsProvider>
            <Router>
              <Toaster position="bottom-right" toastOptions={{ duration: 5000 }} />

              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<LandingPage />} />
                  <Route path="news" element={<NewsPage />} />
                  <Route path="posts" element={<PostsPage />} />
                  <Route path="posts/:postId" element={<SinglePostPage />} />
                  <Route path="players" element={<PlayersPage />} />
                  <Route path="users/:userId" element={<PublicProfilePage />} />
                  <Route path="friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
                  <Route path="messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                  <Route path="messages/:userId" element={<ProtectedRoute><ConversationPage /></ProtectedRoute>} />
                  <Route path="posts/new" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
                  <Route path="posts/:postId/edit" element={<ProtectedRoute><EditPostPage /></ProtectedRoute>} />
                  <Route path="/profile/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                  <Route path="search" element={<SearchPage />} />
                  <Route path="/admin/users" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                  <Route path="/admin/posts" element={<ProtectedRoute><AdminPostsPage /></ProtectedRoute>} />                  <Route path="profile/me" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
                </Route>

                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Routes>
            </Router>
          </NotificationsProvider>
        </ChatProvider>
      </AuthProvider>
    </CssVarsProvider>
  );
}

export default App;