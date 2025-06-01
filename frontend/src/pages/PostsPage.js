import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Chip,
  Stack,
  InputAdornment,
  CircularProgress,
  Divider,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Visibility as VisibilityIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import api from '../api/api';
import API_CONFIG from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';

const PostsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, refreshUserData } = useAuth();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  
  // Состояние фильтров
  const [filters, setFilters] = useState({
    category_id: '',
    q: '',
    sort_by: 'date',
    sort_order: 'desc',
    page: 1,
    per_page: 12
  });

  // Парсим query параметры URL для установки начальных фильтров
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    const updatedFilters = { ...filters };
    
    // Проверяем и устанавливаем значения из URL
    if (searchParams.has('category_id')) {
      updatedFilters.category_id = searchParams.get('category_id');
    }
    
    if (searchParams.has('category')) {
      // Если есть название категории вместо ID, найдем ID по имени позже
      const categoryName = searchParams.get('category');
      updatedFilters.categoryName = categoryName;
    }
    
    if (searchParams.has('q')) {
      updatedFilters.q = searchParams.get('q');
    }
    
    if (searchParams.has('sort_by')) {
      updatedFilters.sort_by = searchParams.get('sort_by');
    }
    
    if (searchParams.has('sort_order')) {
      updatedFilters.sort_order = searchParams.get('sort_order');
    }
    
    if (searchParams.has('page')) {
      updatedFilters.page = parseInt(searchParams.get('page'), 10);
    }
    
    setFilters(updatedFilters);
  }, [location.search]);

  // Загрузка категорий
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/v1/categories/');
        setCategories(response.data);
        
        // Если в URL был передан текст категории, найдем ее ID
        if (filters.categoryName && !filters.category_id) {
          const category = response.data.find(cat => 
            cat.name.toLowerCase() === filters.categoryName.toLowerCase()
          );
          
          if (category) {
            setFilters(prev => ({
              ...prev,
              category_id: category.id.toString()
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchCategories();
  }, [filters.categoryName]);

  // Обновляем данные о пользователе при первоначальной загрузке
  useEffect(() => {
    if (localStorage.getItem('token')) {
      refreshUserData();
    }
  }, []);

  // Загрузка постов
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Обновляем токен авторизации перед выполнением запроса
        const token = localStorage.getItem('token');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        // Создаем query параметры для запроса
        const params = new URLSearchParams();
        
        if (filters.category_id) {
          params.append('category_id', filters.category_id);
        }
        
        if (filters.q) {
          params.append('q', filters.q);
        }
        
        params.append('sort_by', filters.sort_by);
        params.append('sort_order', filters.sort_order);
        params.append('page', filters.page);
        params.append('per_page', filters.per_page);
        
        const response = await api.get(`/api/v1/public/posts?${params}`);
        setPosts(response.data.posts);
        setTotalPages(response.data.total_pages);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Произошла ошибка при загрузке работ. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, [filters]);

  // Обновление URL при изменении фильтров
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.category_id) {
      params.append('category_id', filters.category_id);
    }
    
    if (filters.q) {
      params.append('q', filters.q);
    }
    
    if (filters.sort_by !== 'date') {
      params.append('sort_by', filters.sort_by);
    }
    
    if (filters.sort_order !== 'desc') {
      params.append('sort_order', filters.sort_order);
    }
    
    if (filters.page > 1) {
      params.append('page', filters.page);
    }
    
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(newUrl, { replace: true });
  }, [filters, navigate, location.pathname]);

  // Обработчики изменения фильтров
  const handleCategoryChange = (event) => {
    setFilters(prev => ({
      ...prev,
      category_id: event.target.value,
      page: 1 // Сбрасываем страницу при изменении категории
    }));
  };

  const handleSearchChange = (event) => {
    setFilters(prev => ({
      ...prev,
      q: event.target.value
    }));
  };

  const handleSortByChange = (event) => {
    setFilters(prev => ({
      ...prev,
      sort_by: event.target.value,
      page: 1 // Сбрасываем страницу при изменении сортировки
    }));
  };

  const handleSortOrderChange = (event) => {
    setFilters(prev => ({
      ...prev,
      sort_order: event.target.value,
      page: 1 // Сбрасываем страницу при изменении порядка сортировки
    }));
  };

  const handlePageChange = (event, value) => {
    setFilters(prev => ({
      ...prev,
      page: value
    }));
    
    // Прокрутка страницы вверх при пагинации
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    
    setFilters(prev => ({
      ...prev,
      page: 1 // Сбрасываем страницу при отправке поиска
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      category_id: '',
      q: '',
      sort_by: 'date',
      sort_order: 'desc',
      page: 1,
      per_page: 12
    });
  };

  // Обработчик лайков в списке постов
  const handleLikeToggle = async (postId, isLiked, event) => {
    event.preventDefault(); // Предотвращаем переход на страницу поста
    
    if (!currentUser) {
      navigate('/login', { state: { from: `/posts` } });
      return;
    }
    
    try {
      // Обновляем токен авторизации перед выполнением запроса
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      if (isLiked) {
        await api.delete(`/api/v1/posts/${postId}/like`);
      } else {
        await api.post(`/api/v1/posts/${postId}/like`);
      }
      
      // Обновляем состояние лайка в списке постов
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: !post.is_liked,
            likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
          };
        }
        return post;
      }));
    } catch (err) {
      console.error('Ошибка при изменении статуса лайка:', err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Галерея работ
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Исследуйте творческие работы сообщества талантливых дизайнеров. 
          Используйте фильтры для поиска вдохновения в любой категории.
        </Typography>
      </Box>

      {/* Фильтры */}
      <Box 
        component="form" 
        onSubmit={handleSearchSubmit}
        sx={{ 
          mb: 4,
          p: 3,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Поиск"
              placeholder="Поиск по названию, описанию или автору..."
              variant="outlined"
              value={filters.q}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="category-label">Категория</InputLabel>
              <Select
                labelId="category-label"
                id="category"
                value={filters.category_id}
                onChange={handleCategoryChange}
                label="Категория"
              >
                <MenuItem value="">Все категории</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="sort-by-label">Сортировка</InputLabel>
              <Select
                labelId="sort-by-label"
                id="sort-by"
                value={filters.sort_by}
                onChange={handleSortByChange}
                label="Сортировка"
                startAdornment={
                  <InputAdornment position="start">
                    <SortIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="date">По дате</MenuItem>
                <MenuItem value="popularity">По популярности</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="sort-order-label">Порядок</InputLabel>
              <Select
                labelId="sort-order-label"
                id="sort-order"
                value={filters.sort_order}
                onChange={handleSortOrderChange}
                label="Порядок"
              >
                <MenuItem value="desc">По убыванию</MenuItem>
                <MenuItem value="asc">По возрастанию</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Stack direction="row" spacing={1}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth
              >
                Применить
              </Button>
              <Button 
                variant="outlined" 
                color="inherit" 
                onClick={handleClearFilters}
              >
                Сброс
              </Button>
            </Stack>
          </Grid>
        </Grid>
        
        {/* Активные фильтры */}
        {(filters.category_id || filters.q) && (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Активные фильтры:
            </Typography>
            {filters.category_id && (
              <Chip 
                label={`Категория: ${categories.find(c => c.id.toString() === filters.category_id)?.name || 'Загрузка...'}`}
                onDelete={() => setFilters(prev => ({ ...prev, category_id: '' }))}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
            {filters.q && (
              <Chip 
                label={`Поиск: ${filters.q}`}
                onDelete={() => setFilters(prev => ({ ...prev, q: '' }))}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
        )}
      </Box>

      {/* Сообщение об ошибке */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Индикатор загрузки */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* Результаты поиска */}
          {posts.length > 0 ? (
            <Grid container spacing={3}>
              {posts.map((post) => (
                <Grid item key={post.id} xs={12} sm={6} md={4} lg={3}>
                  <Card 
                    className="card-hover"
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      overflow: 'hidden'
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component={post.media_type === 'video' ? 'video' : 'img'}
                        sx={{ height: 200, objectFit: 'cover' }}
                        image={API_CONFIG.getMediaUrl(post.media_url)}
                        alt={post.title}
                        controls={post.media_type === 'video'}
                      />
                      <Chip
                        label={post.category.name}
                        size="small"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          backgroundColor: 'rgba(76, 175, 80, 0.8)'
                        }}
                      />
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="h2" noWrap>
                        {post.title}
                      </Typography>
                      <Box 
                        component={RouterLink} 
                        to={`/users/${post.user.id}`} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1,
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: 'primary.main'
                          }
                        }}
                      >
                        <Box
                          component="img"
                          src={post.user.avatar ? API_CONFIG.getMediaUrl(post.user.avatar) : `https://ui-avatars.com/api/?name=${post.user.nickname}&background=random`}
                          alt={post.user.nickname}
                          sx={{ width: 24, height: 24, borderRadius: '50%', mr: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {post.user.nickname}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {post.description}
                      </Typography>
                    </CardContent>
                    <Divider />
                    <CardActions>
                      <Stack 
                        direction="row" 
                        spacing={1} 
                        sx={{ width: '100%', justifyContent: 'space-between' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton 
                            aria-label="add to favorites" 
                            size="small"
                            onClick={(e) => handleLikeToggle(post.id, post.is_liked, e)}
                          >
                            {post.is_liked ? (
                              <FavoriteIcon fontSize="small" color="error" />
                            ) : (
                              <FavoriteBorderIcon fontSize="small" />
                            )}
                          </IconButton>
                          <Typography variant="body2" color="text.secondary">
                            {post.likes_count}
                          </Typography>
                          
                          <IconButton aria-label="comments" size="small" sx={{ ml: 1 }}>
                            <CommentIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Button 
                          component={RouterLink} 
                          to={`/posts/${post.id}`}
                          size="small" 
                          color="primary"
                          endIcon={<VisibilityIcon />}
                        >
                          Подробнее
                        </Button>
                      </Stack>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 8,
                backgroundColor: 'background.paper',
                borderRadius: 2,
                boxShadow: 1
              }}
            >
              <Typography variant="h5" gutterBottom>
                Работы не найдены
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Попробуйте изменить критерии поиска или проверьте позже.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleClearFilters} 
                sx={{ mt: 2 }}
              >
                Сбросить фильтры
              </Button>
            </Box>
          )}

          {/* Пагинация */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={filters.page} 
                onChange={handlePageChange} 
                color="primary"
                size="large"
                showFirstButton 
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default PostsPage; 