import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Container, 
  Box, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Pagination,
  Avatar,
  IconButton
} from '@mui/material';
import { 
  CheckCircle as ApproveIcon, 
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../api/api';
import API_CONFIG from '../config/apiConfig';
import { formatDate } from '../utils/dateUtils';

const ModerationPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState({ type: '', message: '' });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState(null);

  // Загрузка постов, ожидающих модерации
  const fetchPendingPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/v1/admin/moderation?page=${page}&per_page=12`);
      console.log('Полный ответ API:', response);
      console.log('Данные ответа API:', response.data);
      
      // Проверка наличия данных в ответе
      if (response.data && response.data.posts) {
        console.log('Найдены посты в response.data.posts:', response.data.posts.length);
        setPosts(response.data.posts);
        setTotalPages(response.data.pagination.pages || 1);
      } else if (response.data && response.data.items) {
        // Альтернативный вариант, если API возвращает items вместо posts
        console.log('Найдены посты в response.data.items:', response.data.items.length);
        setPosts(response.data.items);
        setTotalPages(response.data.pagination.pages || 1);
      } else {
        console.error('Неожиданная структура данных:', response.data);
        console.log('Ключи в response.data:', Object.keys(response.data));
        setError('Неверный формат данных от сервера');
      }
    } catch (err) {
      console.error('Ошибка при загрузке постов на модерацию:', err);
      setError('Не удалось загрузить посты, ожидающие модерации');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPosts();
  }, [page]);

  // Обработка изменения страницы
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Обработка открытия диалога отклонения
  const handleOpenRejectDialog = (post) => {
    setSelectedPost(post);
    setRejectReason('');
    setOpenDialog(true);
  };

  // Обработка закрытия диалога
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPost(null);
    setRejectReason('');
  };

  // Обработка подтверждения поста
  const handleApprovePost = async (postId) => {
    setActionLoading(true);
    setActionResult({ type: '', message: '' });
    try {
      await api.put(`/api/v1/admin/moderation/${postId}`, {
        status: 'approved'
      });
      setPosts(posts.filter(post => post.id !== postId));
      setActionResult({ 
        type: 'success', 
        message: 'Пост успешно одобрен и опубликован' 
      });
    } catch (err) {
      console.error('Ошибка при одобрении поста:', err);
      setActionResult({ 
        type: 'error', 
        message: 'Не удалось одобрить пост. Пожалуйста, попробуйте еще раз.' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Обработка отклонения поста
  const handleRejectPost = async () => {
    if (!selectedPost) return;
    
    setActionLoading(true);
    setActionResult({ type: '', message: '' });
    try {
      await api.put(`/api/v1/admin/moderation/${selectedPost.id}`, {
        status: 'rejected',
        reject_reason: rejectReason
      });
      setPosts(posts.filter(post => post.id !== selectedPost.id));
      setActionResult({ 
        type: 'success', 
        message: 'Пост отклонен' 
      });
      handleCloseDialog();
    } catch (err) {
      console.error('Ошибка при отклонении поста:', err);
      setActionResult({ 
        type: 'error', 
        message: 'Не удалось отклонить пост. Пожалуйста, попробуйте еще раз.' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Обработчик открытия предпросмотра поста
  const handlePreviewPost = (post) => {
    setPreviewPost(post);
    setPreviewOpen(true);
  };

  // Обработчик закрытия предпросмотра поста
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewPost(null);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Модерация постов
        </Typography>
        
        {actionResult.type && (
          <Alert 
            severity={actionResult.type} 
            sx={{ mb: 3 }}
            onClose={() => setActionResult({ type: '', message: '' })}
          >
            {actionResult.message}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        ) : posts.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            Нет постов, ожидающих модерации
          </Alert>
        ) : (
          <>
            <Grid container spacing={3}>
              {posts.map((post) => (
                <Grid item xs={12} sm={6} md={4} key={post.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <CardMedia
                      component={post.media_type === 'video' ? 'video' : 'img'}
                      height="180"
                      image={API_CONFIG.getMediaUrl(post.media_url)}
                      controls={post.media_type === 'video'}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="h2" noWrap>
                        {post.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {post.description}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={`Автор: ${post.user.nickname}`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                        <Chip 
                          label={post.category.name} 
                          size="small"
                          color="secondary"
                          variant="outlined" 
                        />
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                      <Button 
                        size="small" 
                        onClick={() => handlePreviewPost(post)}
                        startIcon={<ViewIcon />}
                      >
                        Просмотр
                      </Button>
                      <Box>
                        <Button 
                          size="small" 
                          color="success"
                          startIcon={<ApproveIcon />}
                          onClick={() => handleApprovePost(post.id)}
                          disabled={actionLoading}
                          sx={{ mr: 1 }}
                        >
                          Принять
                        </Button>
                        <Button 
                          size="small" 
                          color="error"
                          startIcon={<RejectIcon />}
                          onClick={() => handleOpenRejectDialog(post)}
                          disabled={actionLoading}
                        >
                          Отклонить
                        </Button>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={handlePageChange} 
                  color="primary" 
                />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Диалог для просмотра поста */}
      <Dialog 
        open={previewOpen} 
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        {previewPost && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{previewPost.title}</Typography>
              <IconButton onClick={handleClosePreview} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                {previewPost.media_type === 'video' ? (
                  <video
                    src={API_CONFIG.getMediaUrl(previewPost.media_url)}
                    controls
                    style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
                  />
                ) : (
                  <Box
                    component="img"
                    src={API_CONFIG.getMediaUrl(previewPost.media_url)}
                    alt={previewPost.title}
                    sx={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
                  />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  src={previewPost.user.avatar ? API_CONFIG.getMediaUrl(previewPost.user.avatar) : `https://ui-avatars.com/api/?name=${previewPost.user.nickname}&background=random`}
                  alt={previewPost.user.nickname}
                  sx={{ mr: 1 }}
                />
                <Typography variant="subtitle1">
                  {previewPost.user.nickname}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(new Date(previewPost.created_at))}
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                {previewPost.description}
              </Typography>
              
              <Box sx={{ display: 'flex', mt: 2, gap: 1 }}>
                <Chip 
                  label={previewPost.category.name} 
                  color="primary" 
                  variant="outlined" 
                  size="small" 
                />
                <Chip 
                  label={`На модерации`} 
                  color="warning" 
                  size="small" 
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button 
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => {
                  handleClosePreview();
                  handleApprovePost(previewPost.id);
                }}
                disabled={actionLoading}
              >
                Принять
              </Button>
              <Button 
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => {
                  handleClosePreview();
                  handleOpenRejectDialog(previewPost);
                }}
                disabled={actionLoading}
              >
                Отклонить
              </Button>
              <Button onClick={handleClosePreview} color="inherit">
                Закрыть
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Диалог для отклонения поста */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Отклонить пост</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Пожалуйста, укажите причину отклонения поста. Эта информация будет отправлена автору.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="reject-reason"
            label="Причина отклонения"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Отмена
          </Button>
          <Button 
            onClick={handleRejectPost} 
            color="error" 
            disabled={!rejectReason.trim() || actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Отклонить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ModerationPage;
