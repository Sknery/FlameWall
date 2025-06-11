// frontend/src/components/BannedUserOverlay.js

import React from 'react';
import { Box, Typography, Button, Sheet } from '@mui/joy';
import BlockIcon from '@mui/icons-material/Block';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

function BannedUserOverlay() {
  const { logout } = useAuth();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
      }}
    >
      <Sheet
        variant="outlined"
        sx={{
          p: 4,
          borderRadius: 'md',
          textAlign: 'center',
          boxShadow: 'lg',
        }}
      >
        <BlockIcon sx={{ fontSize: 60, color: 'danger.500', mb: 2 }} />
        <Typography level="h1" component="h1" textColor="danger.500">
          You Have Been Banned
        </Typography>
        <Typography sx={{ mt: 1, mb: 3 }}>
          Your account has been suspended. Please contact support for more information.
        </Typography>
        <Button
          variant="solid"
          color="neutral"
          startDecorator={<LogoutIcon />}
          onClick={logout}
        >
          Logout
        </Button>
      </Sheet>
    </Box>
  );
}

export default BannedUserOverlay;