import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Импортируем хук для получения параметров из URL
import axios from 'axios';
import {
  Typography,
  CircularProgress,
  Alert,
  Box,
  Sheet,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemDecorator,
  ListItemContent
} from '@mui/joy';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function SinglePostPage() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postId) return; 

    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/posts/${postId}`);
        setPost(response.data);
      } catch (err) {
        setError('Failed to load post. It may have been deleted or the link is incorrect.');
        console.error('Error fetching single post:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]); 

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size="lg" /></Box>;
  }

  if (error) {
    return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  }

  if (!post) {
    return <Typography>Post not found.</Typography>;
  }

  return (
    <Box>
      <Sheet variant="outlined" sx={{ p: 3, borderRadius: 'md' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar src={post.author?.pfp_url}>{post.author ? post.author.username.charAt(0) : '?'}</Avatar>
          <Box>
            <Typography level="title-md">{post.author ? post.author.username : 'Anonymous'}</Typography>
            <Typography level="body-xs">Posted on {new Date(post.created_at).toLocaleDateString()}</Typography>
          </Box>
        </Box>
        <Typography level="h1" component="h1" sx={{ mb: 2 }}>
          {post.title}
        </Typography>
        <Typography level="body-lg" sx={{ whiteSpace: 'pre-wrap' }}>
          {post.content}
        </Typography>
      </Sheet>

      <Box mt={4}>
        <Typography level="h4" component="h2" sx={{ mb: 2 }}>
          Comments ({post.comments?.length || 0})
        </Typography>
        <List variant="outlined" sx={{ borderRadius: 'sm', bgcolor: 'background.body' }}>
          {post.comments && post.comments.length > 0 ? (
            post.comments.map((comment, index) => (
              <React.Fragment key={comment.id}>
                <ListItem sx={{ alignItems: 'flex-start' }}>
                  <ListItemDecorator>
                    <Avatar src={comment.author?.pfp_url}>{comment.author ? comment.author.username.charAt(0) : '?'}</Avatar>
                  </ListItemDecorator>
                  <ListItemContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography level="title-sm">{comment.author ? comment.author.username : 'Anonymous'}</Typography>
                      <Typography level="body-xs">{new Date(comment.created_at).toLocaleString()}</Typography>
                    </Box>
                    <Typography level="body-md" sx={{ mt: 0.5 }}>{comment.content}</Typography>
                  </ListItemContent>
                </ListItem>
                {index < post.comments.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))
          ) : (
            <ListItem><ListItemContent>No comments yet.</ListItemContent></ListItem>
          )}
        </List>
      </Box>
    </Box>
  );
}

export default SinglePostPage;