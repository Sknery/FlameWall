// src/App.js
import React from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import monochromeDarkTheme from './theme';
import MainLayout from './layouts/MainLayout'; 
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <CssVarsProvider theme={monochromeDarkTheme} defaultMode="dark">
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<LandingPage />} />
          </Route>
        </Routes>
      </Router>
    </CssVarsProvider>
  );
}

export default App;