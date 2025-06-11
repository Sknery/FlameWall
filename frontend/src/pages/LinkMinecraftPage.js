// frontend/src/pages/LinkMinecraftPage.js

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Box,
  Typography,
  Sheet,
  Button,
  CircularProgress,
  Alert,
  Input,
  Link as JoyLink,
  Breadcrumbs,
} from '@mui/joy';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinkIcon from '@mui/icons-material/Link';
import HomeIcon from '@mui/icons-material/Home';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

function LinkMinecraftPage() {
  const { user } = useAuth(); // Получаем текущего пользователя из контекста
  const [code, setCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/linking/generate-code');
      setCode(response.data.code);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const command = `/link ${code}`;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Сбрасываем состояние "скопировано" через 2 секунды
  };

  // Если профиль уже привязан, показываем это
  if (user && user.minecraft_username) {
    return (
        <Box>
            <Typography level="h1" component="h1" sx={{ mb: 2 }}>Minecraft Account</Typography>
            <Sheet variant="soft" color="success" sx={{ p: 2, borderRadius: 'md', textAlign: 'center' }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 'xl4', mb: 1 }}/>
                <Typography level="title-lg">Account Linked!</Typography>
                <Typography>Your website account is linked to the Minecraft account: <strong>{user.minecraft_username}</strong></Typography>
                <Typography level="body-xs" sx={{mt: 1}}>(To unlink your account, please contact support)</Typography>
            </Sheet>
      </Box>
    );
  }

  return (
    <Box>
       <Breadcrumbs separator={<ChevronRightIcon />} sx={{ mb: 2 }}>
        <JoyLink href="/"><HomeIcon /></JoyLink>
        <JoyLink href="/profile/settings">Settings</JoyLink>
        <Typography>Link Minecraft Account</Typography>
      </Breadcrumbs>

      <Typography level="h1" component="h1" sx={{ mb: 1 }}>Link your Minecraft Account</Typography>
      <Typography sx={{ mb: 3 }}>
        Link your website profile to your in-game account to sync your status, friends, and more.
      </Typography>

      {error && <Alert color="danger" sx={{ mb: 2 }}>{error}</Alert>}

      <Sheet variant="outlined" sx={{ p: 3, borderRadius: 'md' }}>
        {code ? (
          <Box sx={{ textAlign: 'center' }}>
            <Typography level="body-md">1. Log in to our Minecraft server.</Typography>
            <Typography level="body-md" sx={{mb: 2}}>2. Type this command in the in-game chat:</Typography>
            <Input
              readOnly
              value={`/link ${code}`}
              endDecorator={
                <Button onClick={handleCopy} variant="soft" startDecorator={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              }
              sx={{ '--Input-decoratorChildHeight': '32px', fontSize: 'lg', fontFamily: 'monospace' }}
            />
            <Typography level="body-xs" sx={{mt: 1}}>This code will expire in 5 minutes.</Typography>
          </Box>
        ) : (
          <Button
            size="lg"
            startDecorator={<LinkIcon />}
            loading={loading}
            onClick={handleGenerateCode}
          >
            Generate one-time code
          </Button>
        )}
      </Sheet>
    </Box>
  );
}

export default LinkMinecraftPage;