// frontend/src/pages/AdminPostsPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Sheet, Table, Input, CircularProgress, Alert, Button, Tooltip, Link, Stack
} from '@mui/joy';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

function AdminPostsPage() {
  const { authToken } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPosts = useCallback(async (query) => {
    setLoading(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { search: query, sortBy: 'created_at', order: 'DESC' },
      };
      const response = await axios.get('/posts', config);
      setPosts(response.data);
    } catch (err) {
      setError('Failed to load post data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchPosts('');
  }, [fetchPosts]);

  const handleSearch = (event) => {
    if (event.key === 'Enter') {
      fetchPosts(searchQuery);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to permanently delete this post?')) return;
    try {
      await axios.delete(`/posts/${postId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      fetchPosts(searchQuery); // Refresh the list
    } catch (err) {
      alert('Failed to delete the post.');
      console.error(err);
    }
  };
  
  const handleEditPost = (postId) => {
    navigate(`/posts/${postId}/edit`);
  };

  if (error) {
    return <Alert color="danger">{error}</Alert>;
  }

  return (
    <Box>
      <Typography level="h1" component="h1" sx={{ mb: 3 }}>
        Post Management
      </Typography>

      <Input
        sx={{ mb: 2, maxWidth: '400px' }}
        placeholder="Search by title and press Enter..."
        startDecorator={<SearchIcon />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleSearch}
      />

      <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table hoverRow>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Author</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.id}</td>
                  <td>
                    <Link component={RouterLink} to={`/posts/${post.id}`}>
                      {post.title}
                    </Link>
                  </td>
                  <td>{post.author?.username || 'N/A'}</td>
                  <td>{new Date(post.created_at).toLocaleDateString()}</td>
                  <td>
                    <Stack direction="row" spacing={1}>
                      <Button size="sm" variant="outlined" color="neutral" onClick={() => handleEditPost(post.id)}>
                        <EditIcon />
                      </Button>
                      <Button size="sm" variant="soft" color="danger" onClick={() => handleDeletePost(post.id)}>
                        <DeleteForeverIcon />
                      </Button>
                    </Stack>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Sheet>
    </Box>
  );
}

export default AdminPostsPage;