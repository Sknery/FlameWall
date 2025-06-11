import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, FormControl, FormLabel, Input, Textarea, Button, Alert, CircularProgress } from '@mui/joy';

function EditPostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { authToken, user: currentUser } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`/posts/${postId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        const post = response.data;

        // --- ИСПРАВЛЕНИЕ ЛОГИКИ ПРОВЕРКИ ПРАВ ---
        const isAdmin = currentUser && ['ADMIN', 'MODERATOR', 'OWNER'].includes(currentUser.rank);
        const isAuthor = currentUser?.id === post.author?.id;

        if (!isAuthor && !isAdmin) {
          setIsForbidden(true);
          setError('You are not authorized to edit this post.');
          return;
        }
        // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

        setTitle(post.title);
        setContent(post.content);
      } catch (err) {
        setError('Failed to load post data.');
      } finally {
        setLoading(false);
      }
    };

    if (postId && authToken && currentUser) {
      fetchPost();
    }
  }, [postId, authToken, currentUser]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.patch(
        `/posts/${postId}`,
        { title, content },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      navigate(`/posts/${postId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  
  if (isForbidden || error) return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography level="h1" component="h1">Edit Post</Typography>
      {error && <Alert color="danger">{error}</Alert>}
      <FormControl required>
        <FormLabel>Title</FormLabel>
        <Input placeholder="Enter a title for your post" value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormControl>
      <FormControl required>
        <FormLabel>Content</FormLabel>
        <Textarea placeholder="Write your post content here..." minRows={10} value={content} onChange={(e) => setContent(e.target.value)} />
      </FormControl>
      <Button type="submit" loading={loading} sx={{ mt: 1 }}>Save Changes</Button>
    </Box>
  );
}

export default EditPostPage;