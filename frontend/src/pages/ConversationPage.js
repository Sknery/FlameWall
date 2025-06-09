import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import { useChat } from '../context/ChatContext'; // useChat больше не нужен напрямую
import { useNotifications } from '../context/NotificationsContext';
import { Box, Typography, Sheet, CircularProgress, Alert, Textarea, IconButton, Avatar, Stack, FormControl } from '@mui/joy';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function ConversationPage() {
  const { userId: otherUserId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, authToken, socket } = useAuth();
  // --- ДОБАВЛЕНО: Достаем функцию из контекста ---
  const { markNotificationsAsReadByLink } = useNotifications();

  // Локальное состояние для чата
  const [conversations, setConversations] = useState({});
  const [isConnected, setIsConnected] = useState(socket?.connected || false);

  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const messages = conversations[otherUserId] || [];
  
  // --- ДОБАВЛЕНО: Сообщаем бэкенду о просмотре чата ---
   useEffect(() => {
    if (socket && otherUserId) {
      socket.emit('startViewingChat', { otherUserId: Number(otherUserId) });
      return () => {
        socket.emit('stopViewingChat');
      };
    }
  }, [socket, otherUserId]);

  const loadConversationHistory = useCallback(async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/messages/conversation/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setConversations(prev => ({ ...prev, [id]: response.data }));
    } catch (error) {
      console.error("Failed to load conversation history", error);
    }
  }, [authToken]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const userRes = await axios.get(`${API_BASE_URL}/users/${otherUserId}`);
        setOtherUser(userRes.data);
        await loadConversationHistory(otherUserId);
      } catch (err) {
        setError('Failed to load user data.');
      } finally {
        setLoading(false);
      }
    };
    
    if (otherUserId && authToken) {
      loadInitialData();
      // --- ДОБАВЛЕНО: При загрузке страницы помечаем уведомления из этого чата как прочитанные ---
      // Ссылка должна соответствовать той, что генерируется на бэкенде
      markNotificationsAsReadByLink(`/messages/${otherUserId}`);
    }
    // --- ИЗМЕНЕНО: Добавляем markNotificationsAsReadByLink в зависимости ---
  }, [otherUserId, authToken, loadConversationHistory, markNotificationsAsReadByLink]);

  // Этот useEffect слушает новые сообщения и статусы подключения (без изменений)
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message) => {
      const currentId = currentUser?.id;
      if (!currentId) return;
      const involvedUserId = message.sender.id === currentId ? message.receiver.id : message.sender.id;
      if (String(involvedUserId) === String(otherUserId)) {
          setConversations(prev => {
            const currentMessages = prev[involvedUserId] || [];
            if (currentMessages.find(m => m.id === message.id)) return prev;
            return { ...prev, [involvedUserId]: [...currentMessages, message] };
        });
      }
    };
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    socket.on('newMessage', handleNewMessage);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, currentUser, otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    socket.emit('sendMessage', { recipientId: Number(otherUserId), content: newMessage });
    setNewMessage('');
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert color="danger">{error}</Alert>;
  if (!otherUser) return <Typography>User not found.</Typography>;

  return (
    <Sheet sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate('/messages')} sx={{ mr: 2 }}><ArrowBackIcon /></IconButton>
        <Avatar src={otherUser.pfp_url} />
        <Typography level="title-lg" sx={{ ml: 2 }}>{otherUser.username}</Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <Stack spacing={2}>
          {messages.map(msg => (
            <Box 
              key={msg.id} 
              sx={{ display: 'flex', justifyContent: msg.sender?.id === currentUser?.id ? 'flex-end' : 'flex-start' }}
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
            endDecorator={ <IconButton type="submit" disabled={!newMessage.trim() || !isConnected}><SendIcon /></IconButton> }
          />
        </FormControl>
      </Box>
    </Sheet>
  );
}

export default ConversationPage;