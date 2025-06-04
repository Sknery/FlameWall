// src/layouts/MainLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import CollapsiblePushSidebar from '../components/CollapsiblePushSidebar';

const MainLayout = () => {
  return (
    <CollapsiblePushSidebar>
      <Outlet />
    </CollapsiblePushSidebar>
  );
};

export default MainLayout;