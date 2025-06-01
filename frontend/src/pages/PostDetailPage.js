import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Container,
  Box,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Avatar,
  Button,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/dateUtils';
import API_CONFIG from '../config/apiConfig';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, refreshUserData } = useAuth();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDeleteCommentDialog, setOpenDeleteCommentDialog] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  
  // Обновляем данные о пользователе и запрашиваем пост после обновления
  useEffect(() => {
    const initPage = async () => {
      if (localStorage.getItem('token')) {
        await refreshUserData();
        // После обновления данных пользователя загрузим данные поста
        fetchPostDetails();
      } else {
        fetchPostDetails();
      }
    };
    
    initPage();
  }, []);
  
  // Функция для загрузки деталей поста и комментариев
  const fetchPostDetails = async () => {
    setLoading(true);
    try {
      // Обновляем токен авторизации перед выполнением запроса
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Токен установлен в заголовки:', token);
      } else {
        console.log('Токен не найден');
      }
      
      console.log('Отправка запроса на', `/api/v1/public/posts/${id}`);
      const response = await api.get(`/api/v1/public/posts/${id}`);
      console.log('Полученные данные поста:', response.data);
      console.log('URL медиа:', response.data.media_url);
      console.log('Полный URL медиа:', API_CONFIG.getMediaUrl(response.data.media_url));
      
      // Проверяем, есть ли информация о лайке в localStorage
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
      
      // Если в localStorage есть информация о том, что пост лайкнут,
      // но сервер говорит, что нет - обновляем данные с сервера
      if (likedPosts[id] === true && !response.data.is_liked) {
        console.log('Несоответствие состояния лайка между localStorage и сервером');
        // Устанавливаем is_liked в true, если пользователь ранее лайкнул пост
        response.data.is_liked = true;
      }
      
      setPost(response.data);
      
      // Загружаем комментарии
      const commentsResponse = await api.get(`/api/v1/public/posts/${id}/comments`);
      console.log('Полученные комментарии:', commentsResponse.data);
      setComments(commentsResponse.data || []);
    } catch (err) {
      console.error('Ошибка при загрузке данных поста:', err);
      console.error('Детали ошибки:', err.message);
      if (err.response) {
        console.error('Статус ошибки:', err.response.status);
        console.error('Данные ошибки:', err.response.data);
      }
      setError('Не удалось загрузить данные поста');
    } finally {
      setLoading(false);
    }
  };

  // Обновляем загрузку поста, когда id меняется
  useEffect(() => {
    fetchPostDetails();
  }, [id]);
  
  const handleLikeToggle = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/posts/${id}` } });
      return;
    }
    
    try {
      // Обновляем токен авторизации перед выполнением запроса
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Токен установлен в заголовки для лайка:', token);
      } else {
        console.log('Токен не найден при попытке лайка');
      }
      
      // Выводим больше информации о состоянии запроса
      console.log('Текущее состояние лайка:', post.is_liked);
      console.log('ID поста для лайка:', id);
      
      // Получаем текущее состояние лайков из localStorage
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
      
      try {
        if (post.is_liked) {
          console.log('Отправка запроса на удаление лайка');
          const response = await api.delete(`/api/v1/posts/${id}/like`);
          console.log('Ответ от сервера при удалении лайка:', response.data);
          
          // Обновляем состояние лайка
          setPost({
            ...post,
            is_liked: false,
            likes_count: post.likes_count - 1
          });
          
          // Сохраняем состояние лайка в localStorage
          likedPosts[id] = false;
          localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
        } else {
          console.log('Отправка запроса на добавление лайка');
          const response = await api.post(`/api/v1/posts/${id}/like`);
          console.log('Ответ от сервера при добавлении лайка:', response.data);
          
          // Обновляем состояние лайка
          setPost({
            ...post,
            is_liked: true,
            likes_count: post.likes_count + 1
          });
          
          // Сохраняем состояние лайка в localStorage
          likedPosts[id] = true;
          localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
        }
      } catch (err) {
        // Обрабатываем особые ошибки сервера
        if (err.response && err.response.status === 500 && err.response.data.detail === 'пост уже лайкнут') {
          console.log('Пост уже лайкнут, обновляем состояние');
          // Если пост уже лайкнут, но на фронтенде показано что нет, исправляем
          if (!post.is_liked) {
            setPost({
              ...post,
              is_liked: true
            });
            
            // Сохраняем состояние лайка в localStorage
            likedPosts[id] = true;
            localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
          }
        } else if (err.response && err.response.status === 500 && err.response.data.detail === 'пост не был лайкнут') {
          console.log('Пост не был лайкнут, обновляем состояние');
          // Если пост не был лайкнут, но на фронтенде показано что да, исправляем
          if (post.is_liked) {
            setPost({
              ...post,
              is_liked: false
            });
            
            // Сохраняем состояние лайка в localStorage
            likedPosts[id] = false;
            localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
          }
        } else {
          // Пробрасываем ошибку дальше для общей обработки
          throw err;
        }
      }
    } catch (err) {
      console.error('Ошибка при изменении статуса лайка:', err);
      console.error('Детали ошибки:', err.message);
      if (err.response) {
        console.error('Статус ошибки:', err.response.status);
        console.error('Данные ошибки:', err.response.data);
      }
      
      // Если ошибка 500, возможно проблема со стороны сервера
      // Обновляем данные поста, чтобы получить актуальное состояние
      console.log('Получаем актуальные данные поста после ошибки');
      fetchPostDetails();
    }
  };
  
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim() || !currentUser) return;
    
    setSubmitting(true);
    try {
      // Обновляем токен авторизации перед выполнением запроса
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Токен установлен в заголовки для комментария:', token);
      } else {
        console.log('Токен не найден при попытке добавить комментарий');
      }
      
      console.log('Отправка комментария для поста ID:', id);
      console.log('Текст комментария:', commentText);
      
      // Отправляем данные в соответствии с требованиями API
      const commentData = {
        content: commentText,
        post_id: parseInt(id) // Добавляем post_id согласно требованиям бэкенда
      };
      
      console.log('Отправляемые данные:', commentData);
      
      const response = await api.post(`/api/v1/posts/${id}/comments`, commentData);
      
      console.log('Ответ от сервера при добавлении комментария:', response.data);
      
      // Добавляем новый комментарий в список
      setComments([...comments, response.data]);
      setCommentText('');
    } catch (err) {
      console.error('Ошибка при отправке комментария:', err);
      console.error('Детали ошибки:', err.message);
      if (err.response) {
        console.error('Статус ошибки:', err.response.status);
        console.error('Данные ошибки:', err.response.data);
        
        // Показываем сообщение об ошибке валидации если есть
        if (err.response.status === 422 && err.response.data.errors) {
          console.error('Ошибки валидации:', err.response.data.errors);
        }
      }
      
      // Если ошибка 500, возможно есть проблема на стороне сервера
      // Можно добавить обновление данных или другую логику восстановления
      if (err.response && (err.response.status === 500 || err.response.status === 422)) {
        console.log('Получаем актуальные комментарии после ошибки');
        
        try {
          const commentsResponse = await api.get(`/api/v1/public/posts/${id}/comments`);
          setComments(commentsResponse.data || []);
        } catch (fetchError) {
          console.error('Ошибка при получении комментариев:', fetchError);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  // Функция для открытия диалога подтверждения удаления
  const handleDeleteClick = () => {
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
      
      console.log('Отправка запроса на удаление поста ID:', id);
      
      const response = await api.delete(`/api/v1/posts/${id}`);
      console.log('Ответ от сервера при удалении поста:', response.data);
      
      // Закрываем диалог
      setOpenDeleteDialog(false);
      
      // Показываем сообщение об успешном удалении (можно добавить Toast или другой UI-элемент)
      alert('Пост успешно удален');
      
      // Перенаправляем пользователя на страницу профиля или ленту
      navigate('/profile');
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
  
  // Функция для открытия диалога подтверждения удаления комментария
  const handleDeleteCommentClick = (comment) => {
    setSelectedComment(comment);
    setOpenDeleteCommentDialog(true);
  };
  
  // Функция для закрытия диалога без удаления комментария
  const handleCloseDeleteCommentDialog = () => {
    setOpenDeleteCommentDialog(false);
    setSelectedComment(null);
  };
  
  // Функция для удаления комментария после подтверждения
  const handleDeleteComment = async () => {
    if (!selectedComment) return;
    
    try {
      // Обновляем токен авторизации перед выполнением запроса
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('Отправка запроса на удаление комментария ID:', selectedComment.id);
      
      const response = await api.delete(`/api/v1/posts/comments/${selectedComment.id}`);
      console.log('Ответ от сервера при удалении комментария:', response.data);
      
      // Закрываем диалог
      setOpenDeleteCommentDialog(false);
      
      // Обновляем список комментариев (удаляем удаленный комментарий)
      setComments(comments.filter(comment => comment.id !== selectedComment.id));
      
      // Очищаем выбранный комментарий
      setSelectedComment(null);
    } catch (err) {
      console.error('Ошибка при удалении комментария:', err);
      console.error('Детали ошибки:', err.message);
      if (err.response) {
        console.error('Статус ошибки:', err.response.status);
        console.error('Данные ошибки:', err.response.data);
      }
      
      // Показываем сообщение об ошибке
      alert('Ошибка при удалении комментария. Попробуйте позже.');
      
      // Закрываем диалог
      setOpenDeleteCommentDialog(false);
      // Очищаем выбранный комментарий
      setSelectedComment(null);
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ my: 4 }}>{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={handleBack}>
          Вернуться назад
        </Button>
      </Container>
    );
  }
  
  if (!post) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ my: 4 }}>
          Пост не найден или был удален
        </Alert>
        <Button startIcon={<BackIcon />} onClick={handleBack}>
          Вернуться назад
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mb: 3 }}>
          Вернуться назад
        </Button>
        
        {/* Добавляем кнопку удаления, видимую только автору поста */}
        {currentUser && post.user && currentUser.id === post.user.id && (
          <Button 
            startIcon={<DeleteIcon />} 
            color="error" 
            onClick={handleDeleteClick}
            sx={{ mb: 3, ml: 2 }}
          >
            Удалить пост
          </Button>
        )}
        
        {post?.status === 'rejected' && currentUser && post.user.id === currentUser.id && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Этот пост был отклонен модератором.
            {post.reject_reason && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Причина: {post.reject_reason}
              </Typography>
            )}
          </Alert>
        )}
        
        {post?.status === 'pending' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Этот пост находится на модерации и будет опубликован после проверки.
          </Alert>
        )}
        
        <Card sx={{ mb: 4 }}>
          {post?.media_type === 'image' ? (
            <CardMedia
              component="img"
              sx={{ 
                maxHeight: 500, 
                height: '100%',
                objectFit: 'contain', 
                bgcolor: 'background.paper', // Используем тот же серый цвет, что и в комментариях
                width: '100%'
              }}
              image={post ? API_CONFIG.getMediaUrl(post.media_url) : ''}
              alt={post?.title}
            />
          ) : post?.media_type === 'video' ? (
            <CardMedia
              component="video"
              sx={{ 
                maxHeight: 500, 
                width: '100%',
                bgcolor: 'background.paper' // Используем тот же серый цвет, что и в комментариях
              }}
              src={post ? API_CONFIG.getMediaUrl(post.media_url) : ''}
              controls
            />
          ) : null}
          
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box 
                component={RouterLink} 
                to={`/users/${post?.user?.id}`} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.main'
                  }
                }}
              >
                <Avatar 
                  src={post?.user ? API_CONFIG.getMediaUrl(post.user.avatar) : ''} 
                  alt={post?.user?.nickname}
                  sx={{ mr: 1.5 }}
                />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {post?.user?.nickname}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {post?.created_at ? formatDate(new Date(post.created_at)) : ''}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label={post?.category?.name} 
                  color="secondary" 
                  variant="outlined" 
                />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    size="small" 
                    color={post?.is_liked ? 'primary' : 'default'} 
                    onClick={handleLikeToggle}
                  >
                    {post?.is_liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {post?.likes_count || 0}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Typography variant="h4" component="h1" gutterBottom>
              {post?.title}
            </Typography>
            
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {post?.description}
            </Typography>
          </CardContent>
        </Card>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Комментарии ({comments.length})
          </Typography>
          
          {currentUser ? (
            <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 3 }}>
              <Grid container spacing={1} alignItems="flex-start">
                <Grid item xs>
                  <TextField
                    fullWidth
                    placeholder="Добавить комментарий..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={submitting}
                    multiline
                    rows={2}
                    variant="outlined"
                  />
                </Grid>
                <Grid item>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    endIcon={<SendIcon />}
                    disabled={submitting || !commentText.trim()}
                    sx={{ height: '100%' }}
                  >
                    Отправить
                  </Button>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography>
                Войдите в аккаунт, чтобы оставлять комментарии
              </Typography>
            </Alert>
          )}
          
          {comments.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Нет комментариев. Оставьте первый!
              </Typography>
            </Box>
          ) : (
            comments.map((comment) => (
              <Paper key={comment.id} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                  <Box 
                    component={RouterLink} 
                    to={`/users/${comment.user?.id}`} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      textDecoration: 'none',
                      color: 'inherit',
                      '&:hover': {
                        textDecoration: 'underline',
                        color: 'primary.main'
                      }
                    }}
                  >
                    <Avatar 
                      src={comment.user?.avatar ? API_CONFIG.getMediaUrl(comment.user.avatar) : ''} 
                      alt={comment.user?.nickname}
                      sx={{ width: 32, height: 32, mr: 1 }}
                    />
                    <Typography variant="subtitle2">
                      {comment.user?.nickname}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {comment.created_at ? formatDate(new Date(comment.created_at)) : ''}
                    </Typography>
                  </Box>
                  
                  {/* Кнопка удаления комментария (только для автора) */}
                  {currentUser && comment.user && comment.user.id === currentUser.id && (
                    <IconButton 
                      size="small" 
                      color="default" 
                      onClick={() => handleDeleteCommentClick(comment)}
                      aria-label="удалить комментарий"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Typography variant="body1">
                  {comment.content}
                </Typography>
              </Paper>
            ))
          )}
        </Box>
        
        {/* Диалог подтверждения удаления комментария */}
        <Dialog
          open={openDeleteCommentDialog}
          onClose={handleCloseDeleteCommentDialog}
        >
          <DialogTitle>Подтверждение удаления комментария</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Вы уверены, что хотите удалить этот комментарий? Это действие нельзя будет отменить.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteCommentDialog} color="primary">
              Отмена
            </Button>
            <Button onClick={handleDeleteComment} color="error" variant="contained">
              Удалить
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Диалог подтверждения удаления поста */}
        <Dialog
          open={openDeleteDialog}
          onClose={handleCloseDeleteDialog}
        >
          <DialogTitle>Подтверждение удаления</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Вы уверены, что хотите удалить этот пост? Это действие нельзя будет отменить.
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
      </Box>
    </Container>
  );
};

export default PostDetailPage;
