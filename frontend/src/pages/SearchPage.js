// frontend/src/pages/SearchPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemContent as JoyListItemContent,
  Link as JoyLink,
  Divider,
} from '@mui/joy';
import { constructImageUrl } from '../utils/url';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query');

  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResults = useCallback(async () => {
    if (!query) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Выполняем оба запроса параллельно
      const [usersRes, postsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/users`, { params: { search: query } }),
        axios.get(`${API_BASE_URL}/posts`, { params: { search: query } })
      ]);
      setResults({ users: usersRes.data, posts: postsRes.data });
    } catch (err) {
      setError('Failed to fetch search results.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert color="danger">{error}</Alert>;
  }

  const noResults = results.users.length === 0 && results.posts.length === 0;

  return (
    <Box>
      <Typography level="h1" component="h1" sx={{ mb: 3 }}>
        Search Results for: "{query}"
      </Typography>

      {noResults ? (
        <Typography>No results found.</Typography>
      ) : (
        <Grid container spacing={4}>
          {results.posts.length > 0 && (
            <Grid xs={12}>
              <Typography level="h3" component="h2" sx={{ mb: 2 }}>Found Posts</Typography>
              <List variant="outlined" sx={{ borderRadius: 'sm' }}>
                {results.posts.map((post, index) => (
                  <React.Fragment key={post.id}>
                    <ListItem>
                      <JoyListItemContent>
                        <JoyLink component={RouterLink} to={`/posts/${post.id}`} level="title-md">{post.title}</JoyLink>
                        <Typography level="body-sm">{post.content.substring(0, 150)}...</Typography>
                      </JoyListItemContent>
                    </ListItem>
                    {index < results.posts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Grid>
          )}

          {results.users.length > 0 && (
            <Grid xs={12}>
                <Typography level="h3" component="h2" sx={{ mt: 4, mb: 2 }}>Found Players</Typography>
                <Grid container spacing={2}>
                    {results.users.map((user) => (
                        <Grid xs={12} sm={6} md={4} key={user.id}>
                            <Card component={RouterLink} to={`/users/${user.profile_slug || user.id}`} sx={{ textDecoration: 'none' }}>
                                <CardContent sx={{ alignItems: 'center', textAlign: 'center' }}>
                                    <Avatar src={constructImageUrl(user.pfp_url)} sx={{ '--Avatar-size': '80px', mb: 1 }} />
                                    <Typography level="title-lg">{user.username}</Typography>
                                    <Chip size="sm" color="primary" sx={{ mt: 0.5 }}>{user.rank}</Chip>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}

export default SearchPage;