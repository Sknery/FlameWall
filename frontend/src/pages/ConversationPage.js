// frontend/src/pages/ConversationPage.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import {
  Box, Typography, Sheet, CircularProgress, Alert, Textarea, IconButton, Avatar, Stack, FormControl, Button,
  Dropdown, Menu, MenuButton, MenuItem, Link as JoyLink
} from '@mui/joy';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { constructImageUrl } from '../utils/url';
// --- ДОБАВЛЕНО ---
import CircleIcon from '@mui/icons-material/Circle';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function ConversationPage() {
  const { userId: otherUserId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, authToken, socket } = useAuth();
  const { markNotificationsAsReadByLink } = useNotifications();
  
  const [conversations, setConversations] = useState({});
  const [isConnected, setIsConnected] = useState(socket?.connected || false);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const messagesEndRef = useRef(null);
  const messages = conversations[otherUserId] || [];

  // --- ДОБАВЛЕНО: Слушатель для статуса собеседника ---
  useEffect(() => {
    if (!socket || !otherUser) return;

    const handleStatusUpdate = (data) => {
        if (data.userId === otherUser.id) {
            setOtherUser(prevUser => ({
                ...prevUser,
                is_minecraft_online: data.is_minecraft_online
            }));
        }
    };

    socket.on('userStatusUpdate', handleStatusUpdate);

    return () => {
        socket.off('userStatusUpdate', handleStatusUpdate);
    };
  }, [socket, otherUser]);
  
  const handleReplyLinkClick = (event, messageId) => {
    event.preventDefault(); 
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => { setHighlightedMessageId(null); }, 1500);
    }
  };

  useEffect(() => {
    if (socket && otherUserId) {
      socket.emit('startViewingChat', { otherUserId: Number(otherUserId) });
      return () => { socket.emit('stopViewingChat'); };
    }
  }, [socket, otherUserId]);

  const loadInitialData = useCallback(async () => {
    if (!otherUserId || !authToken) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const [userRes, friendshipRes, conversationRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/users/${otherUserId}`, config),
        axios.get(`${API_BASE_URL}/friendships/status/${otherUserId}`, config),
        axios.get(`${API_BASE_URL}/messages/conversation/${otherUserId}`, config)
      ]);
      setOtherUser(userRes.data);
      setFriendshipStatus(friendshipRes.data.status);
      setConversations(prev => ({ ...prev, [otherUserId]: conversationRes.data }));
      markNotificationsAsReadByLink(`/messages/${otherUserId}`);
    } catch (err) {
      setError('Failed to load chat data. This user may not exist.');
    } finally {
      setLoading(false);
    }
  }, [otherUserId, authToken, markNotificationsAsReadByLink]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!socket) return;
    const handleMessageUpdate = (updatedMessage) => {
      const convoId = updatedMessage.sender.id === currentUser.id ? updatedMessage.receiver.id : updatedMessage.sender.id;
      if (String(convoId) !== otherUserId) return;
      setConversations(prev => {
        const currentConvo = prev[otherUserId] || [];
        const existingIndex = currentConvo.findIndex(m => m.id === updatedMessage.id);
        let newConvo;
        if (existingIndex > -1) {
          newConvo = [...currentConvo];
          newConvo[existingIndex] = updatedMessage;
        } else {
          newConvo = [...currentConvo, updatedMessage];
        }
        return { ...prev, [otherUserId]: newConvo };
      });
    };
    const handleMessageDelete = ({ messageId }) => {
      setConversations(prev => {
        const currentConvo = prev[otherUserId] || [];
        const newConvo = currentConvo.map(m => 
          m.id === messageId 
          ? { ...m, content: 'Message has been deleted.', is_deleted: true } 
          : m
        );
        return { ...prev, [otherUserId]: newConvo };
      });
    };
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    socket.on('newMessage', handleMessageUpdate);
    socket.on('messageEdited', handleMessageUpdate);
    socket.on('messageDeleted', handleMessageDelete);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    return () => {
      socket.off('newMessage', handleMessageUpdate);
      socket.off('messageEdited', handleMessageUpdate);
      socket.off('messageDeleted', handleMessageDelete);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, currentUser, otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || isInputDisabled) return;
    if (editingMessage) {
      socket.emit('editMessage', { messageId: editingMessage.id, content: newMessage });
    } else {
      socket.emit('sendMessage', {
        recipientId: Number(otherUserId),
        content: newMessage,
        parentMessageId: replyingToMessage ? replyingToMessage.id : null,
      });
    }
    cancelActions();
  };
  
  const handleEditClick = (message) => {
    setEditingMessage({ id: message.id, content: message.content });
    setNewMessage(message.content);
    setReplyingToMessage(null);
  };
  const handleReplyClick = (message) => {
    setReplyingToMessage({ id: message.id, sender: message.sender, content: message.content });
    setEditingMessage(null);
  };
  const handleDeleteClick = (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      socket.emit('deleteMessage', { messageId });
    }
  };
  const cancelActions = () => {
    setEditingMessage(null);
    setReplyingToMessage(null);
    setNewMessage('');
  };

  let isInputDisabled = true;
  let placeholderText = 'Loading...';
  if (!loading) {
    switch (friendshipStatus) {
        case 'ACCEPTED':
            isInputDisabled = false;
            placeholderText = 'Type a message...';
            break;
        case 'BLOCKED':
            placeholderText = 'You cannot message this user while a block is active.';
            break;
        default:
            placeholderText = 'You must be friends to send messages.';
            break;
    }
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert color="danger">{error}</Alert>;
  if (!otherUser) return <Typography>User not found.</Typography>;
  
  return (
    <Sheet sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/messages')} sx={{ mr: 2 }}><ArrowBackIcon /></IconButton>
          <Avatar src={constructImageUrl(otherUser.pfp_url)} />
          {/* --- ИЗМЕНЕНО: Добавляем Stack для имени и статуса --- */}
          <Stack sx={{ ml: 2 }}>
            <Typography level="title-lg">{otherUser.username}</Typography>
            {otherUser.minecraft_username && (
                 <Typography 
                    level="body-xs" 
                    startDecorator={<CircleIcon sx={{ fontSize: '8px' }} />} 
                    sx={{ color: otherUser.is_minecraft_online ? 'success.400' : 'text.tertiary' }}
                 >
                    {otherUser.is_minecraft_online ? 'Online' : 'Offline'}
                 </Typography>
            )}
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            <Stack spacing={2}>
            {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender?.id === currentUser?.id}
                  isHighlighted={highlightedMessageId === msg.id}
                  onReplyLinkClick={handleReplyLinkClick}
                  onEdit={() => handleEditClick(msg)}
                  onDelete={() => handleDeleteClick(msg.id)}
                  onReply={() => handleReplyClick(msg)}
                />
            ))}
            <div ref={messagesEndRef} />
            </Stack>
        </Box>

        <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        {(replyingToMessage || editingMessage) && (
          <Sheet variant="soft" sx={{ p: 1, mb: 1, borderRadius: 'sm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{overflow: 'hidden'}}>
              <Typography level="title-sm">
                {editingMessage ? 'Editing message' : `Replying to ${replyingToMessage.sender.username}`}
              </Typography>
              <Typography level="body-sm" noWrap sx={{ opacity: 0.7 }}>
                {editingMessage ? editingMessage.content : replyingToMessage.content}
              </Typography>
            </Box>
            <IconButton size="sm" onClick={cancelActions} variant="plain"><CloseIcon /></IconButton>
          </Sheet>
        )}
         <FormControl>
          <Textarea
            placeholder={placeholderText}
            disabled={isInputDisabled}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { handleSendMessage(e); } }}
            endDecorator={
              <IconButton type="submit" disabled={!newMessage.trim() || !isConnected || isInputDisabled}>
                <SendIcon />
              </IconButton>
            }
          />
        </FormControl>
      </Box>
    </Sheet>
  );
}

const MessageBubble = ({ message, isOwn, isHighlighted, onReplyLinkClick, onEdit, onDelete, onReply }) => {
  const [isHovered, setIsHovered] = useState(false);
  const wasEdited = new Date(message.updated_at).getTime() - new Date(message.sent_at).getTime() > 1000;

  const messageContent = (
    <Sheet 
      variant="solid" 
      color={isOwn ? 'primary' : 'neutral'} 
      sx={{ 
        p: 1, 
        borderRadius: 'lg', 
        maxWidth: '750px', 
        wordBreak: 'break-word',
        transition: 'background-color 0.3s ease-in-out',
        ...(isHighlighted && {
          bgcolor: isOwn ? 'primary.500' : 'neutral.700',
        })
      }}
    >
      {message.parentMessage && !message.parentMessage.is_deleted && (
        <JoyLink 
          onClick={(e) => onReplyLinkClick(e, message.parentMessage.id)}
          href={`#msg-${message.parentMessage.id}`} 
          sx={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Sheet variant="soft" sx={{ p: 1, borderRadius: 'sm', mb: 1, opacity: 0.8 }}>
            <Stack>
                <Typography level="title-sm">{message.parentMessage.sender.username}</Typography>
                <Typography level="body-xs" sx={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}>
                    {message.parentMessage.content}
                </Typography>
            </Stack>
          </Sheet>
        </JoyLink>
      )}
      <Typography level="body-md" sx={{ fontStyle: message.is_deleted ? 'italic' : 'normal', opacity: message.is_deleted ? 0.7 : 1 }}>
        {message.content}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center', mt: 0.5 }}>
        {wasEdited && !message.is_deleted && <Typography level="body-xs" sx={{ opacity: 0.7 }}>edited</Typography>}
        <Typography level="body-xs" sx={{ opacity: 0.7 }}>
          {new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
    </Sheet>
  );

  const menu = (
    <Box sx={{
        width: '32px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: isHovered && !message.is_deleted ? 1 : 0,
        transition: 'opacity 0.2s',
      }}>
        <Dropdown>
            <MenuButton slots={{ root: IconButton }} slotProps={{ root: { variant: 'plain', color: 'neutral', size: 'sm' } }}>
                <MoreHorizIcon />
            </MenuButton>
            <Menu size="sm" placement="bottom-end">
                <MenuItem onClick={onReply}><ReplyIcon /> Reply</MenuItem>
                {isOwn && <MenuItem onClick={onEdit}><EditIcon /> Edit</MenuItem>}
                {isOwn && <MenuItem color="danger" onClick={onDelete}><DeleteIcon /> Delete</MenuItem>}
            </Menu>
        </Dropdown>
    </Box>
  );

  return (
    <Box 
        id={`msg-${message.id}`} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}
    >
      {!isOwn && (
        <>
            <Avatar src={constructImageUrl(message.sender?.pfp_url)} />
            {messageContent}
            {menu}
        </>
      )}
      {isOwn && (
        <>
            {menu}
            {messageContent}
            <Avatar src={constructImageUrl(message.sender?.pfp_url)} />
        </>
      )}
    </Box>
  );
};

export default ConversationPage;