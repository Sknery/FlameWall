import React, { useState, useEffect } from 'react';
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
} from '@mui/joy';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

// Используем переменную окружения для базового URL нашего API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Эта функция будет выполняться один раз при загрузке страницы
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        // Отправляем GET-запрос на бэкенд
        const response = await axios.get(`${API_BASE_URL}/news`);
        setNews(response.data); // Сохраняем полученные данные в состояние
      } catch (err) {
        setError('Failed to load news. The server might be down.');
        console.error('Error fetching news:', err);
      } finally {
        setLoading(false); // Убираем индикатор загрузки в любом случае
      }
    };

    fetchNews();
  }, []); // Пустой массив [] означает, что эффект выполнится только один раз

  // Пока данные загружаются, показываем индикатор загрузки
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size="lg" />
      </Box>
    );
  }

  // Если произошла ошибка, показываем сообщение об ошибке
  if (error) {
    return <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>;
  }

  // Если все хорошо, отображаем список новостей
  return (
    <Box>
      <Typography level="h1" component="h1" sx={{ mb: 2 }}>
        Server News
      </Typography>
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
            <ListItemContent>No news articles found.</ListItemContent>
          </ListItem>
        )}
      </List>
    </Box>
  );
}

export default NewsPage;