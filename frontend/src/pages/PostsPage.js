import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
} from '@mui/joy';
import AddIcon from '@mui/icons-material/Add';
import VoteButtons from '../components/VoteButtons';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isLoggedIn, authToken } = useAuth();

  const fetchPosts = useCallback(async () => {
    try {
      // setLoading(true) здесь не нужен, чтобы избежать мерцания при голосовании
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/posts`);
      setPosts(response.data);
    } catch (err) {
      setError('Failed to load posts. Please try again later.');
      console.error('Error fetching posts:', err);
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
      console.error(`Failed to vote for post:`, error);
      alert(error.response?.data?.message || 'Failed to vote.');
    }
  }, [isLoggedIn, authToken, fetchPosts]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size="lg" /></Box>;
  }

  if (error) {
    return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography level="h1" component="h1">
          Community Posts
        </Typography>
        {isLoggedIn && (
          <Button
            component={RouterLink}
            to="/posts/new"
            startDecorator={<AddIcon />}
          >
            Create Post
          </Button>
        )}
      </Box>
      <List variant="outlined" sx={{ borderRadius: 'sm', bgcolor: 'background.body' }}>
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <React.Fragment key={post.id}>
              <ListItem>
                <Sheet sx={{ p: 2, flexGrow: 1, bgcolor: 'transparent' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Avatar src={post.author?.pfp_url}>{post.author ? post.author.username.charAt(0) : '?'}</Avatar>
                    <Typography level="title-md">{post.author ? post.author.username : 'Anonymous'}</Typography>
                  </Box>

                  <JoyLink
                    component={RouterLink}
                    to={`/posts/${post.id}`}
                    level="h4"
                    fontWeight="lg"
                    overlay
                    sx={{
                      '&:hover': { textDecoration: 'underline' },
                      mb: 1,
                    }}
                  >
                    {post.title}
                  </JoyLink>

                  <Typography level="body-md" sx={{
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
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
                    <Typography level="body-xs">
                      {new Date(post.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Sheet>
              </ListItem>
              {index < posts.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))
        ) : (
          <ListItem><ListItemContent>No posts found. Be the first to create one!</ListItemContent></ListItem>
        )}
      </List>
    </Box>
  );
}

export default PostsPage;