import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Card,
  CardMedia,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Title as TitleIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  Delete as DeleteIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import api from '../api/api';

// Схема валидации
const PostSchema = Yup.object().shape({
  title: Yup.string()
    .min(3, 'Заголовок должен содержать минимум 3 символа')
    .max(100, 'Заголовок должен содержать максимум 100 символов')
    .required('Заголовок обязателен'),
  description: Yup.string()
    .min(3, 'Описание должно содержать минимум 3 символа')
    .max(5000, 'Описание должно содержать максимум 5000 символов')
    .required('Описание обязательно'),
  category_id: Yup.number()
    .required('Выберите категорию')
});

const CreatePostPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [uploadError, setUploadError] = useState(null);

  // Загрузка категорий при монтировании компонента
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/v1/categories/');
        setCategories(response.data);
      } catch (err) {
        console.error('Ошибка при загрузке категорий:', err);
        setError('Не удалось загрузить категории. Пожалуйста, попробуйте позже.');
      }
    };

    fetchCategories();
  }, []);

  // Обработчик выбора медиафайла
  const handleMediaChange = (event) => {
    const file = event.target.files[0];
    setUploadError(null);

    if (!file) return;

    // Проверка типа файла
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm'];
    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      setUploadError('Поддерживаемые форматы: JPEG, PNG, GIF, MP4, WEBM');
      return;
    }

    // Проверка размера файла (не более 32MB)
    if (file.size > 32 * 1024 * 1024) {
      setUploadError('Размер файла не должен превышать 32MB');
      return;
    }

    // Создание предпросмотра
    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    setMediaFile(file);
    setMediaType(isImage ? 'image' : 'video');
  };

  // Обработчик удаления медиафайла
  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType('');
  };

  // Обработчик отправки формы
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    // Проверка наличия медиафайла
    if (!mediaFile) {
      setUploadError('Пожалуйста, загрузите изображение или видео');
      setSubmitting(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Создание объекта FormData для отправки файла
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('category_id', values.category_id);
      formData.append('media', mediaFile);

      // Отправка запроса на создание поста
      const response = await api.post('/api/v1/posts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Ответ сервера при создании поста:', response.data);

      // Проверяем, что ответ содержит id созданного поста
      if (response.data && response.data.id) {
        // Сброс формы
        resetForm();
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType('');
        
        // Показываем сообщение об успехе
        alert('Пост успешно создан и отправлен на модерацию. После проверки модератором он будет опубликован.');
        
        // Перенаправляем на главную страницу
        navigate('/');
      } else {
        // Если ответ сервера не содержит id поста, но запрос успешный
        console.warn('Пост создан, но структура ответа не соответствует ожидаемой:', response.data);
        
        // Сброс формы
        resetForm();
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType('');
        
        // Показываем сообщение об успехе
        alert('Пост успешно создан и отправлен на модерацию. После проверки модератором он будет опубликован.');
        
        // Перенаправляем на главную страницу
        navigate('/');
      }
    } catch (err) {
      console.error('Ошибка при создании поста:', err);
      
      // Добавляем детальное логирование ошибки
      if (err.response) {
        console.error('Ответ сервера:', err.response.status, err.response.data);
        
        // Проверяем, был ли пост создан, несмотря на ошибку
        if (err.response.status === 201 || err.response.status === 200) {
          // Если ответ 201 Created или 200 OK, считаем что пост создан
          resetForm();
          setMediaFile(null);
          setMediaPreview(null);
          setMediaType('');
          
          alert('Пост успешно создан и отправлен на модерацию, несмотря на некоторые проблемы с ответом сервера.');
          navigate('/');
          return;
        }
      }
      
      const errorMessage = err.response?.data?.message || 'Не удалось загрузить данные поста. Пожалуйста, попробуйте позже.';
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Создание поста
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Заполните форму, чтобы поделиться своей работой с сообществом дизайнеров
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Загрузка медиафайла */}
          <Grid item xs={12}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 2
              }}
            >
              <Typography variant="h6" gutterBottom>
                Медиафайл
              </Typography>
              
              {!mediaPreview ? (
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 6,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'rgba(76, 175, 80, 0.04)'
                    }
                  }}
                  component="label"
                  htmlFor="media-upload"
                >
                  <input
                    accept="image/jpeg,image/png,image/gif,video/mp4,video/webm"
                    style={{ display: 'none' }}
                    id="media-upload"
                    type="file"
                    onChange={handleMediaChange}
                  />
                  <UploadIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                  <Typography variant="body1" gutterBottom>
                    Перетащите файл сюда или нажмите для выбора
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Поддерживаемые форматы: JPEG, PNG, GIF, MP4, WEBM (Максимальный размер: 32MB)
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Card sx={{ mb: 2 }}>
                    {mediaType === 'image' ? (
                      <CardMedia
                        component="img"
                        image={mediaPreview}
                        alt="Предпросмотр изображения"
                        sx={{ maxHeight: 400, objectFit: 'contain' }}
                      />
                    ) : (
                      <CardMedia
                        component="video"
                        src={mediaPreview}
                        controls
                        sx={{ maxHeight: 400 }}
                      />
                    )}
                  </Card>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleRemoveMedia}
                    >
                      Удалить
                    </Button>
                  </Box>
                </Box>
              )}

              {uploadError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {uploadError}
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Форма */}
          <Grid item xs={12}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 2
              }}
            >
              <Formik
                initialValues={{
                  title: '',
                  description: '',
                  category_id: ''
                }}
                validationSchema={PostSchema}
                onSubmit={handleSubmit}
              >
                {({ errors, touched, values, handleChange, isSubmitting }) => (
                  <Form>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          id="title"
                          name="title"
                          label="Заголовок"
                          variant="outlined"
                          error={touched.title && Boolean(errors.title)}
                          helperText={touched.title && errors.title}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <TitleIcon color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <FormControl fullWidth error={touched.category_id && Boolean(errors.category_id)}>
                          <InputLabel id="category-label">Категория</InputLabel>
                          <Select
                            labelId="category-label"
                            id="category_id"
                            name="category_id"
                            value={values.category_id}
                            onChange={handleChange}
                            label="Категория"
                            startAdornment={
                              <InputAdornment position="start">
                                <CategoryIcon color="primary" />
                              </InputAdornment>
                            }
                          >
                            {categories.map((category) => (
                              <MenuItem key={category.id} value={category.id}>
                                {category.name}
                              </MenuItem>
                            ))}
                          </Select>
                          {touched.category_id && errors.category_id && (
                            <FormHelperText>{errors.category_id}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          id="description"
                          name="description"
                          label="Описание"
                          variant="outlined"
                          multiline
                          rows={6}
                          error={touched.description && Boolean(errors.description)}
                          helperText={touched.description && errors.description}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                <DescriptionIcon color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/posts')}
                      >
                        Отмена
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting || isLoading}
                        startIcon={isSubmitting || isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                      >
                        Опубликовать
                      </Button>
                    </Box>
                  </Form>
                )}
              </Formik>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default CreatePostPage; 