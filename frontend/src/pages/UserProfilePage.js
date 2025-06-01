import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Container, 
  Box, 
  Grid, 
  Paper, 
  Avatar, 
  Tabs, 
  Tab, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions, 
  Button, 
  IconButton, 
  Chip,
  Divider,
  Link,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Edit as EditIcon,
  Favorite as FavoriteIcon,
  VisibilityOutlined as VisibilityIcon,
  Telegram as TelegramIcon,
  Language as WebIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import API_CONFIG from '../config/apiConfig';
import { formatDate } from '../utils/dateUtils';

const UserProfilePage = () => {
  const { id } = useParams();
  const { currentUser, refreshUserData } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isOwnProfile = !id || (currentUser && currentUser.id.toString() === id);

  // Загрузка данных пользователя и его работ при монтировании
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Обновляем токен авторизации
        const token = localStorage.getItem('token');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        // Если это собственный профиль, используем данные текущего пользователя
        if (isOwnProfile && currentUser) {
          setUser(currentUser);
        } else {
          // Иначе загружаем данные указанного пользователя
          const userResponse = await api.get(`/api/v1/public/users/${id}`);
          setUser(userResponse.data);
        }
        
        // Загружаем работы пользователя
        const userId = isOwnProfile ? currentUser?.id : id;
        if (userId) {
          // Загружаем посты пользователя
          const postsResponse = await api.get(`/api/v1/public/users/${userId}/posts`);
          
          // Временно добавляем подробный лог для диагностики
          console.log('DEBUG: Полный ответ API для постов:', JSON.stringify(postsResponse.data));
          
          // Обрабатываем ответ - проверяем различные форматы данных
          let postsData = [];
          if (Array.isArray(postsResponse.data)) {
            postsData = postsResponse.data;
          } else if (postsResponse.data && Array.isArray(postsResponse.data.items)) {
            // Если ответ содержит поле items, которое является массивом
            postsData = postsResponse.data.items;
          } else if (postsResponse.data && typeof postsResponse.data === 'object') {
            // Обрабатываем другие возможные форматы данных
            // Проверяем все поля объекта на наличие массива
            for (const key in postsResponse.data) {
              if (Array.isArray(postsResponse.data[key])) {
                postsData = postsResponse.data[key];
                break;
              }
            }
          }
          console.log('DEBUG: Извлеченные данные постов:', postsData);
          setPosts(postsData);
          
          // Загружаем лайкнутые посты (если это собственный профиль)
          if (isOwnProfile && token) {
            const likedPostsResponse = await api.get('/api/v1/users/me/likes');
            
            // Временно добавляем подробный лог для диагностики
            console.log('DEBUG: Полный ответ API для лайкнутых постов:', JSON.stringify(likedPostsResponse.data));
            
            // Обрабатываем ответ - проверяем различные форматы данных
            let likedPostsData = [];
            if (Array.isArray(likedPostsResponse.data)) {
              likedPostsData = likedPostsResponse.data;
            } else if (likedPostsResponse.data && Array.isArray(likedPostsResponse.data.items)) {
              // Если ответ содержит поле items, которое является массивом
              likedPostsData = likedPostsResponse.data.items;
            } else if (likedPostsResponse.data && typeof likedPostsResponse.data === 'object') {
              // Обрабатываем другие возможные форматы данных
              // Проверяем все поля объекта на наличие массива
              for (const key in likedPostsResponse.data) {
                if (Array.isArray(likedPostsResponse.data[key])) {
                  likedPostsData = likedPostsResponse.data[key];
                  break;
                }
              }
            }
            console.log('DEBUG: Извлеченные данные лайкнутых постов:', likedPostsData);
            setLikedPosts(likedPostsData);
          }
        }
      } catch (err) {
        console.error('Ошибка при загрузке данных профиля:', err);
        setError('Не удалось загрузить данные профиля. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    // Уменьшаем количество зависимостей, чтобы избежать бесконечных обновлений
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUser?.id]);
  
  // Обработчик изменения вкладки
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Отображение состояния загрузки
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // Отображение ошибки
  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }
  
  // Отображение сообщения, если пользователь не найден
  if (!user) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 4 }}>Пользователь не найден</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {/* Верхняя секция профиля */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Grid container spacing={3}>
            {/* Аватар пользователя */}
            <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={API_CONFIG.getMediaUrl(user.avatar)}
                alt={user.username}
                sx={{
                  width: 150,
                  height: 150,
                  mb: 2,
                  border: '4px solid',
                  borderColor: 'primary.main'
                }}
              />
              
              {isOwnProfile && (
                <Button
                  component={RouterLink}
                  to="/profile/edit"
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Редактировать профиль
                </Button>
              )}
            </Grid>
            
            {/* Информация о пользователе */}
            <Grid item xs={12} md={9}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                {user.username}
              </Typography>
              
              <Typography variant="h6" color="primary" gutterBottom>
                @{user.nickname}
              </Typography>
              
              {/* Описание пользователя */}
              {user.description && (
                <Typography variant="body1" paragraph sx={{ my: 2 }}>
                  {user.description}
                </Typography>
              )}
              
              {/* Социальные сети */}
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                {user.vk_link && (
                  <Link href={user.vk_link} target="_blank" rel="noopener noreferrer">
                    <Chip
                      icon={<WebIcon />}
                      label="ВКонтакте"
                      color="primary"
                      variant="outlined"
                      clickable
                    />
                  </Link>
                )}
                
                {user.telegram_link && (
                  <Link href={user.telegram_link} target="_blank" rel="noopener noreferrer">
                    <Chip
                      icon={<TelegramIcon />}
                      label="Telegram"
                      color="primary"
                      variant="outlined"
                      clickable
                    />
                  </Link>
                )}
              </Stack>
              
              {/* Статистика */}
              <Box sx={{ mt: 3, display: 'flex', gap: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{Array.isArray(posts) ? posts.length : 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Работ</Typography>
                </Box>
                
                {isOwnProfile && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{Array.isArray(likedPosts) ? likedPosts.length : 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Сохранено</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Вкладки для работ пользователя */}
        <Box sx={{ width: '100%', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Работы" />
            {isOwnProfile && <Tab label="Сохраненные" />}
          </Tabs>
        </Box>
        
        {/* Содержимое вкладок */}
        <Box sx={{ my: 2 }}>
          {/* Работы пользователя */}
          {tabValue === 0 && (
            <Box>
              {posts.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    {isOwnProfile 
                      ? 'У вас еще нет работ. Начните публиковать свои первые проекты!' 
                      : 'У этого пользователя еще нет работ.'}
                  </Typography>
                  
                  {isOwnProfile && (
                    <Button
                      component={RouterLink}
                      to="/create-post"
                      variant="contained"
                      color="primary"
                      sx={{ mt: 2 }}
                    >
                      Создать первую работу
                    </Button>
                  )}
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {Array.isArray(posts) && posts.map((post) => (
                    <Grid item key={post.id} xs={12} sm={6} md={4}>
                      <PostCard post={post} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
          
          {/* Сохраненные работы (лайкнутые) */}
          {tabValue === 1 && isOwnProfile && (
            <Box>
              {likedPosts.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    У вас еще нет сохраненных работ. Сохраняйте понравившиеся работы, нажимая на сердечко!
                  </Typography>
                  
                  <Button
                    component={RouterLink}
                    to="/posts"
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                  >
                    Перейти в галерею
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {Array.isArray(likedPosts) && likedPosts.map((post) => (
                    <Grid item key={post.id} xs={12} sm={6} md={4}>
                      <PostCard post={post} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

// Компонент карточки поста
const PostCard = ({ post }) => {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isOwnPost = currentUser && post.user_id === currentUser.id;
  
  // Временный лог для отладки
  console.log('DEBUG: Рендеринг карточки с данными поста:', post);
  
  // Проверяем, что пост существует и имеет необходимые поля
  if (!post || !post.id) {
    return null; // Не рендерим карточку, если данные некорректны
  }
  
  // Определяем URL медиа с защитой от undefined
  const mediaUrl = post.media_url ? API_CONFIG.getMediaUrl(post.media_url) : '';
  
  // Функция для открытия диалога подтверждения удаления
  const handleDeleteClick = (e) => {
    e.preventDefault(); // Предотвращаем переход по ссылке
    e.stopPropagation(); // Останавливаем всплытие события
    setOpenDeleteDialog(true);
  };
  
  // Функция для закрытия диалога без удаления
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };
  
  // Функция для удаления поста после подтверждения
  const handleDeletePost = async () => {
    try {
      // Обновляем токен авторизации перед выполнением запроса
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('Отправка запроса на удаление поста ID:', post.id);
      
      const response = await api.delete(`/api/v1/posts/${post.id}`);
      console.log('Ответ от сервера при удалении поста:', response.data);
      
      // Закрываем диалог
      setOpenDeleteDialog(false);
      
      // Показываем сообщение об успешном удалении
      alert('Пост успешно удален');
      
      // Перезагружаем страницу для обновления списка постов
      window.location.reload();
    } catch (err) {
      console.error('Ошибка при удалении поста:', err);
      console.error('Детали ошибки:', err.message);
      if (err.response) {
        console.error('Статус ошибки:', err.response.status);
        console.error('Данные ошибки:', err.response.data);
      }
      
      // Показываем сообщение об ошибке
      alert('Ошибка при удалении поста. Попробуйте позже.');
      
      // Закрываем диалог
      setOpenDeleteDialog(false);
    }
  };
  
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} className="card-hover">
      <CardMedia
        component={post.media_type === 'video' ? 'video' : 'img'}
        sx={{ height: 200, bgcolor: 'background.paper' }}
        image={mediaUrl}
        alt={post.title || 'Изображение поста'}
        controls={post.media_type === 'video'}
      />
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="h2" noWrap>
          {post.title || 'Без названия'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {post.description || 'Нет описания'}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Chip 
            label={(post.category && post.category.name) || 'Категория'} 
            size="small" 
            color="primary"
            sx={{ mr: 1 }}
          />
          
          <Typography variant="caption" color="text.secondary">
            {post.created_at ? formatDate(new Date(post.created_at)) : 'Дата не указана'}
          </Typography>
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions>
        <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" color="error">
              <FavoriteIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2">{post.likes_count || 0}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isOwnPost && (
              <IconButton 
                size="small" 
                color="error" 
                onClick={handleDeleteClick}
                aria-label="удалить пост"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
            
            <Button
              component={RouterLink}
              to={`/posts/${post.id}`}
              size="small"
              endIcon={<VisibilityIcon />}
            >
              Подробнее
            </Button>
          </Box>
        </Box>
      </CardActions>
      
      {/* Диалог подтверждения удаления */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить пост "{post.title || 'Без названия'}"? Это действие нельзя будет отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Отмена
          </Button>
          <Button onClick={handleDeletePost} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default UserProfilePage;
