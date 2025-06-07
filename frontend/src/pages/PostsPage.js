import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
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
} from '@mui/joy';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/posts`);
        setPosts(response.data);
      } catch (err) {
        setError('Failed to load posts. Please try again later.');
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size="lg" /></Box>;
  }

  if (error) {
    return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Typography level="h1" component="h1" sx={{ mb: 2 }}>
        Community Posts
      </Typography>
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
                    component={Link} 
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

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', color: 'text.tertiary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarTodayIcon fontSize="sm" />
                      <Typography level="body-sm">{new Date(post.created_at).toLocaleDateString()}</Typography>
                    </Box>
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