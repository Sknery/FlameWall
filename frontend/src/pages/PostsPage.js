import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Typography,
  List,
  ListItem,
  ListItemContent,
  CircularProgress,
  Alert,
  Box,
  Sheet,
  Divider,
  Avatar,
  Link as JoyLink,
  Button,
  IconButton,
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
} from '@mui/joy';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import VoteButtons from '../components/VoteButtons';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isLoggedIn, authToken, user: currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/posts`);
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
        `${API_BASE_URL}/votes/posts/${postId}`,
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
      await axios.delete(`${API_BASE_URL}/posts/${postIdToDelete}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postIdToDelete));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post.');
    }
  }, [authToken]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size="lg" /></Box>;
  }

  if (error) {
    return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  }

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
          const canManagePost = isLoggedIn && currentUser?.id === post?.author?.id;
          return (
            <React.Fragment key={post.id}>
              <ListItem>
                <Sheet sx={{ p: 2, flexGrow: 1, bgcolor: 'transparent' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Avatar src={post.author?.pfp_url}>{post.author ? post.author.username.charAt(0) : '?'}</Avatar>
                    <Typography level="title-md">{post.author ? post.author.username : 'Anonymous'}</Typography>
                    {canManagePost && (
                      // --- ИЗМЕНЕНИЕ ЗДЕСЬ: Добавляем zIndex, чтобы меню было кликабельным ---
                      <Box sx={{ ml: 'auto', position: 'relative', zIndex: 2 }}>
                        <Dropdown>
                          <MenuButton slots={{ root: IconButton }} slotProps={{ root: { variant: 'plain', color: 'neutral', size: 'sm' } }}>
                            <MoreVertIcon />
                          </MenuButton>
                          <Menu size="sm">
                            <MenuItem onClick={() => navigate(`/posts/${post.id}/edit`)}><EditIcon /> Edit</MenuItem>
                            <MenuItem color="danger" onClick={() => handleDeletePost(post.id)}><DeleteForeverIcon /> Delete</MenuItem>
                          </Menu>
                        </Dropdown>
                      </Box>
                    )}
                  </Box>
                  <JoyLink component={RouterLink} to={`/posts/${post.id}`} level="h4" fontWeight="lg" overlay sx={{ '&:hover': { textDecoration: 'underline' }, mb: 1 }}>
                    {post.title}
                  </JoyLink>
                  <Typography level="body-md" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {post.content}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'text.tertiary' }}>
                    <VoteButtons
                      initialLikes={post.likes}
                      initialDislikes={post.dislikes}
                      currentUserVote={0}
                      onVote={(value) => handleVote(post.id, value)}
                      disabled={!isLoggedIn}
                    />
                    <Typography level="body-xs">{new Date(post.created_at).toLocaleDateString()}</Typography>
                  </Box>
                </Sheet>
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );
}

export default PostsPage;