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
} from '@mui/joy';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function CreatePostPage() {
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

    try {
      const response = await axios.post(
        `${API_BASE_URL}/posts`,
        { title, content },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      // После успешного создания переходим на страницу нового поста
      navigate(`/posts/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post.');
      console.error('Error creating post:', err);
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
      <Typography level="h1" component="h1">Create a New Post</Typography>
      
      {error && <Alert color="danger">{error}</Alert>}

      <FormControl required>
        <FormLabel>Title</FormLabel>
        <Input
          placeholder="Enter a title for your post"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormControl>

      <FormControl required>
        <FormLabel>Content</FormLabel>
        <Textarea
          placeholder="Write your post content here..."
          minRows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </FormControl>
       
      <Button type="submit" loading={loading} sx={{ mt: 1 }}>
        Publish Post
      </Button>
    </Box>
  );
}

export default CreatePostPage;