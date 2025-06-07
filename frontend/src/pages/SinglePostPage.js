import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import axios from 'axios';
import {
  Typography, CircularProgress, Alert, Box, Sheet, Divider, Avatar,
  List, ListItem, ListItemDecorator, ListItemContent, Textarea, Button, Link,
  IconButton, Dropdown, Menu, MenuButton, MenuItem,
} from '@mui/joy';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function SinglePostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user: currentUser, authToken } = useAuth();
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newCommentContent, setNewCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Состояния для редактирования комментария
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState('');

  const fetchPost = useCallback(async () => {
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
  }, [postId]);
  
  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId, fetchPost]);

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!newCommentContent.trim() || !isLoggedIn) return;
    
    setIsSubmittingComment(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/posts/${postId}/comments`,
        { content: newCommentContent },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setPost(prevPost => ({
        ...prevPost,
        comments: [...prevPost.comments, response.data],
      }));
      setNewCommentContent('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditClick = (comment) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedContent('');
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/comments/${editingCommentId}`,
        { content: editedContent },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      // Обновляем комментарий в локальном состоянии
      setPost(prevPost => ({
        ...prevPost,
        comments: prevPost.comments.map(c => c.id === editingCommentId ? response.data : c),
      }));
      handleCancelEdit(); // Выходим из режима редактирования
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      // Удаляем комментарий из локального состояния
      setPost(prevPost => ({
        ...prevPost,
        comments: prevPost.comments.filter(c => c.id !== commentId),
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment.');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size="lg" /></Box>;
  if (error) return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  if (!post) return <Typography>Post not found.</Typography>;

  return (
    <Box>
      <Button
        variant="plain"
        startDecorator={<ArrowBackIcon />}
        onClick={() => navigate('/posts')}
        sx={{ mb: 2 }}
      >
        Back to All Posts
      </Button>

      <Sheet variant="outlined" sx={{ p: 3, borderRadius: 'md', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar src={post.author?.pfp_url}>{post.author ? post.author.username.charAt(0) : '?'}</Avatar>
          <Box><Typography level="title-md">{post.author ? post.author.username : 'Anonymous'}</Typography><Typography level="body-xs">Posted on {new Date(post.created_at).toLocaleDateString()}</Typography></Box>
        </Box>
        <Typography level="h1" component="h1" sx={{ mb: 2 }}>{post.title}</Typography>
        <Typography level="body-lg" sx={{ whiteSpace: 'pre-wrap' }}>{post.content}</Typography>
      </Sheet>

      <Box>
        <Typography level="h4" component="h2" sx={{ mb: 2 }}>Comments ({post.comments?.length || 0})</Typography>
        {isLoggedIn ? (
          <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 3 }}>
            <Textarea placeholder="Write a comment..." minRows={3} value={newCommentContent} onChange={(e) => setNewCommentContent(e.target.value)} sx={{ mb: 1 }}/>
            <Button type="submit" loading={isSubmittingComment} endDecorator={<SendIcon />}>Submit Comment</Button>
          </Box>
        ) : (<Typography sx={{mb: 3}}>Please <Link component={NavLink} to="/login">log in</Link> to leave a comment.</Typography>)}

        <List variant="outlined" sx={{ borderRadius: 'sm', bgcolor: 'background.body' }}>
          {post.comments?.length > 0 ? (
            post.comments.map((comment, index) => {
              const isEditing = editingCommentId === comment.id;
              const canEdit = isLoggedIn && (currentUser?.id === comment.author_id || ['ADMIN', 'MODERATOR', 'OWNER'].includes(currentUser?.rank));

              return (
                <React.Fragment key={comment.id}>
                  <ListItem sx={{ alignItems: 'flex-start' }}>
                    <ListItemDecorator><Avatar src={comment.author?.pfp_url}>{comment.author ? comment.author.username.charAt(0) : '?'}</Avatar></ListItemDecorator>
                    <ListItemContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography level="title-sm">{comment.author ? comment.author.username : 'Anonymous'}</Typography>
                        {canEdit && !isEditing && (
                          <Dropdown>
                            <MenuButton slots={{ root: IconButton }} slotProps={{ root: { variant: 'plain', color: 'neutral', size: 'sm' } }}>
                              <MoreVertIcon />
                            </MenuButton>
                            <Menu size="sm">
                              <MenuItem onClick={() => handleEditClick(comment)}><EditIcon /> Edit</MenuItem>
                              <MenuItem onClick={() => handleDeleteComment(comment.id)} color="danger"><DeleteForeverIcon /> Delete</MenuItem>
                            </Menu>
                          </Dropdown>
                        )}
                      </Box>
                      {isEditing ? (
                        <Box component="form" onSubmit={handleUpdateSubmit} sx={{ mt: 1 }}>
                          <Textarea minRows={2} value={editedContent} onChange={(e) => setEditedContent(e.target.value)} sx={{ mb: 1 }} />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button type="submit" size="sm">Save</Button>
                            <Button size="sm" variant="outlined" color="neutral" onClick={handleCancelEdit}>Cancel</Button>
                          </Box>
                        </Box>
                      ) : (
                        <Typography level="body-md" sx={{ mt: 0.5 }}>{comment.content}</Typography>
                      )}
                      <Typography level="body-xs" sx={{ mt: 1, color: 'text.tertiary' }}>{new Date(comment.created_at).toLocaleString()}</Typography>
                    </ListItemContent>
                  </ListItem>
                  {index < post.comments.length - 1 && <Divider component="li" />}
                </React.Fragment>
              )
            })
          ) : (<ListItem><ListItemContent>No comments yet.</ListItemContent></ListItem>)}
        </List>
      </Box>
    </Box>
  );
}

export default SinglePostPage;