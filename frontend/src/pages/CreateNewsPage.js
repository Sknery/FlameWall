// frontend/src/pages/CreateNewsPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Alert,
  Breadcrumbs,
  Link as JoyLink,
} from '@mui/joy';
import HomeIcon from '@mui/icons-material/Home';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

function CreateNewsPage() {
  const navigate = useNavigate();
  const { authToken } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!title.trim() || !content.trim()) {
      setError('Title and content cannot be empty.');
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        '/news',
        { name: title, desc: content },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      // После успешного создания переходим на страницу новостей
      navigate('/news');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create news article.');
      console.error('Error creating news:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <Breadcrumbs separator={<ChevronRightIcon />} sx={{ mb: 1 }}>
        <JoyLink href="/"><HomeIcon /></JoyLink>
        <JoyLink href="/news">News</JoyLink>
        <Typography>Create</Typography>
      </Breadcrumbs>
      
      <Typography level="h1" component="h1">Create News Article</Typography>
      
      {error && <Alert color="danger">{error}</Alert>}

      <FormControl required>
        <FormLabel>Title</FormLabel>
        <Input
          placeholder="Enter the article title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormControl>

      <FormControl required>
        <FormLabel>Content</FormLabel>
        <Textarea
          placeholder="Write the news content here..."
          minRows={12}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </FormControl>
       
      <Button type="submit" loading={loading} sx={{ mt: 1, alignSelf: 'flex-start' }}>
        Publish Article
      </Button>
    </Box>
  );
}

export default CreateNewsPage;