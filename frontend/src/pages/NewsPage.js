// frontend/src/pages/NewsPage.js

import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom'; // Импортируем Link
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Импортируем useAuth
import {
  Typography, List, ListItem, CircularProgress, Alert, Box, Sheet, Divider, Button,
} from '@mui/joy';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add'; // Иконка для кнопки

function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuth(); // Получаем текущего пользователя

  // Определяем, является ли пользователь админом
  const isAdmin = currentUser && ['ADMIN', 'MODERATOR', 'OWNER'].includes(currentUser.rank);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('/news');
        setNews(response.data);
      } catch (err) {
        setError('Failed to load news. The server might be down.');
        console.error('Error fetching news:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size="lg" />
      </Box>
    );
  }

  if (error) {
    return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography level="h1" component="h1">
          Server News
        </Typography>
        {/* --- НОВАЯ КНОПКА ДЛЯ АДМИНОВ --- */}
        {isAdmin && (
          <Button component={RouterLink} to="/admin/news/create" startDecorator={<AddIcon />}>
            Create News
          </Button>
        )}
      </Box>

      <List variant="outlined" sx={{ borderRadius: 'sm', bgcolor: 'background.body' }}>
        {news.length > 0 ? (
          news.map((article, index) => (
            <React.Fragment key={article.id}>
              <ListItem>
                <Sheet sx={{ p: 2, flexGrow: 1, bgcolor: 'transparent' }}>
                  <Typography level="title-lg" component="h2" gutterBottom>
                    {article.name}
                  </Typography>
                  <Typography level="body-md" sx={{ mb: 2 }}>
                    {article.desc}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', color: 'text.tertiary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon fontSize="sm" />
                      <Typography level="body-sm">
                        {article.author ? article.author.username : 'System'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarTodayIcon fontSize="sm" />
                      <Typography level="body-sm">
                        {new Date(article.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Sheet>
              </ListItem>
              {index < news.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <Typography>No news articles found.</Typography>
          </ListItem>
        )}
      </List>
    </Box>
  );
}

export default NewsPage;