import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Box, Typography, Sheet, CircularProgress, Alert, Textarea, IconButton, Avatar, Stack, FormControl, Link } from '@mui/joy';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function ConversationPage() {
  const { userId: otherUserId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, authToken } = useAuth();
  const { sendMessage, lastMessage } = useChat();
  
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const fetchConversation = useCallback(async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const [historyRes, userRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/messages/conversation/${otherUserId}`, config),
        axios.get(`${API_BASE_URL}/users/${otherUserId}`),
      ]);
      setMessages(historyRes.data);
      setOtherUser(userRes.data);
    } catch (err) {
      setError('Failed to load conversation.');
    } finally {
      setLoading(false);
    }
  }, [otherUserId, authToken]);

  useEffect(() => {
    if (otherUserId && authToken) {
      fetchConversation();
    }
  }, [otherUserId, authToken, fetchConversation]);

  // Этот эффект следит за последним сообщением из контекста
  useEffect(() => {
    if (lastMessage) {
      const involvedParties = [lastMessage.sender.id, lastMessage.receiver.id];
      // Проверяем, относится ли новое сообщение к нашему диалогу
      if (involvedParties.includes(currentUser?.id) && involvedParties.includes(Number(otherUserId))) {
        
        // ИСПОЛЬЗУЕМ ФУНКЦИОНАЛЬНУЮ ФОРМУ SETMESSAGES
        setMessages((prevMessages) => {
          // Проверяем, что такого сообщения еще нет в списке
          if (prevMessages.find(m => m.id === lastMessage.id)) {
            return prevMessages; // Если есть, возвращаем старый массив без изменений
          }
          // Если нет, добавляем новое сообщение
          return [...prevMessages, lastMessage];
        });
      }
    }
  }, [lastMessage, currentUser?.id, otherUserId]); // <-- УБРАЛИ 'messages' ИЗ ЗАВИСИМОСТЕЙ


  // Автопрокрутка
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage(Number(otherUserId), newMessage);
    setNewMessage('');
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size="lg" /></Box>;
  if (error) return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  if (!otherUser) return <Typography>User not found.</Typography>;

  return (
    <Sheet sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/messages')} sx={{ mr: 2 }}><ArrowBackIcon /></IconButton>
            <Avatar src={otherUser?.pfp_url} />
            <Typography level="title-lg" sx={{ ml: 2 }}>{otherUser?.username}</Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            <Stack spacing={2}>
            {messages.map(msg => (
                <Box 
                key={msg.id} 
                sx={{ 
                    display: 'flex', 
                    justifyContent: msg.sender?.id === currentUser?.id ? 'flex-end' : 'flex-start',
                }}
                >
                <Sheet 
                    variant="solid" 
                    color={msg.sender?.id === currentUser?.id ? 'primary' : 'neutral'}
                    sx={{ p: 1.5, borderRadius: 'lg', maxWidth: '70%', wordBreak: 'break-word' }}
                >
                    <Typography level="body-md">{msg.content}</Typography>
                    <Typography level="body-xs" sx={{ textAlign: 'right', opacity: 0.7, mt: 0.5 }}>
                    {new Date(msg.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Typography>
                </Sheet>
                </Box>
            ))}
            <div ref={messagesEndRef} />
            </Stack>
        </Box>

        <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <FormControl>
                <Textarea
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { handleSendMessage(e); } }}
                    endDecorator={ <IconButton type="submit" disabled={!newMessage.trim()}><SendIcon /></IconButton> }
                />
            </FormControl>
        </Box>
    </Sheet>
  );
}

export default ConversationPage;