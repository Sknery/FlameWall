// frontend/src/layouts/MainLayout.js

import React from 'react';
import { Outlet } from 'react-router-dom';
import CollapsiblePushSidebar from '../components/CollapsiblePushSidebar';
import { useAuth } from '../context/AuthContext';
import BannedUserOverlay from '../components/BannedUserOverlay';

const MainLayout = () => {
  const { user, isLoggedIn } = useAuth();

  // Если пользователь залогинен и у него стоит флаг is_banned,
  // показываем ему полноэкранную блокировку.
  if (isLoggedIn && user.is_banned) {
    return <BannedUserOverlay />;
  }
  
  // В противном случае, показываем обычный интерфейс сайта.
  return (
    <CollapsiblePushSidebar>
      <Outlet />
    </CollapsiblePushSidebar>
  );
};

export default MainLayout;