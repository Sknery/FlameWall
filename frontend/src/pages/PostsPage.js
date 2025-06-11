// frontend/src/pages/PostsPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Typography, List, ListItem, Sheet, Avatar, Link as JoyLink, Button, IconButton, Dropdown, Menu, MenuButton, MenuItem, Stack, CircularProgress, Alert, Box
} from '@mui/joy';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import BlockIcon from '@mui/icons-material/Block';
import VoteButtons from '../components/VoteButtons';
import { constructImageUrl } from '../utils/url';

function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isLoggedIn, authToken, user: currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/posts');
      setPosts(response.data);
    } catch (err) {
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleVote = useCallback(async (postId, value) => {
    if (!isLoggedIn) {
      alert('Please log in to vote.');
      return;
    }
    try {
      await axios.post(
        `/votes/posts/${postId}`,
        { value },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      fetchPosts();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to vote.');
    }
  }, [isLoggedIn, authToken, fetchPosts]);

  const handleDeletePost = useCallback(async (postIdToDelete) => {
    if (!window.confirm('Are you sure you want to permanently delete this post?')) return;
    try {
      await axios.delete(`/posts/${postIdToDelete}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postIdToDelete));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post.');
    }
  }, [authToken]);
  
  const handleBanUser = useCallback(async (author) => {
    if (!author) return;
    if (!window.confirm(`Are you sure you want to ban ${author.username}?`)) return;
    
    try {
      await axios.post(`/admin/users/${author.id}/ban`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      alert(`User ${author.username} has been banned.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to ban user.');
    }
  }, [authToken]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size="lg" /></Box>;
  }

  if (error) {
    return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  }

  const isAdmin = currentUser && ['ADMIN', 'MODERATOR', 'OWNER'].includes(currentUser.rank);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography level="h1" component="h1">Community Posts</Typography>
        {isLoggedIn && (
          <Button component={RouterLink} to="/posts/new" startDecorator={<AddIcon />}>
            Create Post
          </Button>
        )}
      </Box>

      <List variant="outlined" sx={{ borderRadius: 'sm', bgcolor: 'background.body' }}>
        {posts.map((post) => {
          const canManagePost = isLoggedIn && (currentUser?.id === post.author?.id || isAdmin);
          
          return (
            <ListItem key={post.id} sx={{ '&:not(:last-of-type)': { borderBottom: '1px solid', borderColor: 'divider' } }}>
              <Sheet sx={{ p: 2, flexGrow: 1, bgcolor: 'transparent' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  {post.author ? (
                    <JoyLink component={RouterLink} to={`/users/${post.author.profile_slug || post.author.id}`}>
                      <Avatar src={constructImageUrl(post.author.pfp_url)}>{post.author.username.charAt(0)}</Avatar>
                    </JoyLink>
                  ) : (
                    <Avatar>?</Avatar>
                  )}
                  
                  <Typography level="title-md">
                    {post.author ? (
                      <JoyLink component={RouterLink} to={`/users/${post.author.profile_slug || post.author.id}`} overlay sx={{ color: 'text.primary' }}>
                        {post.author.username}
                      </JoyLink>
                    ) : (
                      'Anonymous'
                    )}
                  </Typography>

                  {canManagePost && (
                    <Box sx={{ ml: 'auto' }}>
                      <Dropdown>
                        <MenuButton slots={{ root: IconButton }} slotProps={{ root: { variant: 'plain', color: 'neutral', size: 'sm' } }}>
                          <MoreVertIcon />
                        </MenuButton>
                        <Menu size="sm">
                          <MenuItem onClick={() => navigate(`/posts/${post.id}/edit`)}><EditIcon /> Edit</MenuItem>
                          <MenuItem color="danger" onClick={() => handleDeletePost(post.id)}><DeleteForeverIcon /> Delete</MenuItem>
                          {isAdmin && currentUser?.id !== post.author?.id && (
                              <MenuItem color="danger" onClick={() => handleBanUser(post.author)}>
                                  <BlockIcon /> Ban Author
                              </MenuItem>
                          )}
                        </Menu>
                      </Dropdown>
                    </Box>
                  )}
                </Box>
                <JoyLink component={RouterLink} to={`/posts/${post.id}`} level="h4" fontWeight="lg" sx={{ '&:hover': { textDecoration: 'underline' }, mb: 1, color: 'text.primary' }}>
                  {post.title}
                </JoyLink>
                <Typography level="body-md" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {post.content}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'text.tertiary' }}>
                  <VoteButtons
                    initialScore={post.score}
                    currentUserVote={0} 
                    onVote={(value) => handleVote(post.id, value)}
                    disabled={!isLoggedIn}
                  />
                  <Typography level="body-xs">{new Date(post.created_at).toLocaleDateString()}</Typography>
                </Box>
              </Sheet>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

export default PostsPage;