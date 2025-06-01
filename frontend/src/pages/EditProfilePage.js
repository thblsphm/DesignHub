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
  Avatar,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  AccountCircle as AccountIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Telegram as TelegramIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import API_CONFIG from '../config/apiConfig';

// Схема валидации
const ProfileSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Имя должно содержать минимум 3 символа')
    .max(50, 'Имя должно содержать максимум 50 символов')
    .required('Имя обязательно'),
  nickname: Yup.string()
    .min(3, 'Никнейм должен содержать минимум 3 символа')
    .max(50, 'Никнейм должен содержать максимум 50 символов')
    .matches(/^[a-zA-Z0-9_.]+$/, 'Никнейм может содержать только буквы, цифры, точки и подчеркивания')
    .required('Никнейм обязателен'),
  description: Yup.string()
    .max(500, 'Описание должно содержать максимум 500 символов'),
  vk_link: Yup.string()
    .url('Введите действительный URL')
    .nullable(),
  telegram_link: Yup.string()
    .url('Введите действительный URL')
    .nullable(),
});

const EditProfilePage = () => {
  const { currentUser, updateUserProfile, updateAvatar, error } = useAuth();
  const navigate = useNavigate();
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Получаем полный URL аватара с использованием API_CONFIG
  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (currentUser?.avatar) return API_CONFIG.getMediaUrl(currentUser.avatar);
    return null;
  };
  
  console.log('Текущий аватар:', currentUser?.avatar);
  console.log('Полный URL аватара:', getAvatarUrl());

  // Если пользователь не авторизован, будет перенаправлен на страницу входа через ProtectedRoute

  // Обработчик выбора аватара
  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    setUploadError(null);

    if (!file) return;

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Поддерживаются только изображения в форматах JPEG, PNG и GIF');
      return;
    }

    // Проверка размера файла (не более 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Размер файла не должен превышать 5MB');
      return;
    }

    // Создание предпросмотра аватара
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setAvatarFile(file);
  };

  // Обработчик обновления аватара
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      const success = await updateAvatar(formData);
      if (success) {
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Ошибка при обновлении аватара:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Редактирование профиля
        </Typography>

        <Grid container spacing={4}>
          {/* Аватар */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                borderRadius: 2
              }}
            >
              <Avatar
                src={getAvatarUrl()}
                alt={currentUser?.username}
                sx={{ width: 150, height: 150, mb: 2 }}
              />

              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload"
                type="file"
                onChange={handleAvatarChange}
              />
              <label htmlFor="avatar-upload">
                <IconButton
                  color="primary"
                  aria-label="upload avatar"
                  component="span"
                  disabled={isSubmitting}
                >
                  <PhotoCameraIcon />
                </IconButton>
              </label>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Изменить аватар
              </Typography>

              {uploadError && (
                <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                  {uploadError}
                </Alert>
              )}

              {avatarPreview && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAvatarUpload}
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                  sx={{ mt: 2 }}
                >
                  Сохранить аватар
                </Button>
              )}
            </Paper>
          </Grid>

          {/* Форма */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 2
              }}
            >
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {updateSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Профиль успешно обновлен
                </Alert>
              )}

              <Formik
                initialValues={{
                  username: currentUser?.username || '',
                  nickname: currentUser?.nickname || '',
                  description: currentUser?.description || '',
                  vk_link: currentUser?.vk_link || '',
                  telegram_link: currentUser?.telegram_link || ''
                }}
                validationSchema={ProfileSchema}
                onSubmit={async (values, { setSubmitting }) => {
                  setIsSubmitting(true);
                  try {
                    const success = await updateUserProfile(values);
                    if (success) {
                      setUpdateSuccess(true);
                      setTimeout(() => setUpdateSuccess(false), 3000);
                    }
                  } catch (err) {
                    console.error('Ошибка при обновлении профиля:', err);
                  } finally {
                    setSubmitting(false);
                    setIsSubmitting(false);
                  }
                }}
              >
                {({ errors, touched, isSubmitting: formSubmitting }) => (
                  <Form>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          id="username"
                          name="username"
                          label="Имя"
                          variant="outlined"
                          error={touched.username && Boolean(errors.username)}
                          helperText={touched.username && errors.username}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          id="nickname"
                          name="nickname"
                          label="Никнейм"
                          variant="outlined"
                          error={touched.nickname && Boolean(errors.nickname)}
                          helperText={touched.nickname && errors.nickname}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AccountIcon color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          id="description"
                          name="description"
                          label="О себе"
                          variant="outlined"
                          multiline
                          rows={4}
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

                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Социальные сети
                          </Typography>
                        </Divider>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          id="vk_link"
                          name="vk_link"
                          label="VK"
                          placeholder="https://vk.com/username"
                          variant="outlined"
                          error={touched.vk_link && Boolean(errors.vk_link)}
                          helperText={touched.vk_link && errors.vk_link}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LanguageIcon color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          id="telegram_link"
                          name="telegram_link"
                          label="Telegram"
                          placeholder="https://t.me/username"
                          variant="outlined"
                          error={touched.telegram_link && Boolean(errors.telegram_link)}
                          helperText={touched.telegram_link && errors.telegram_link}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <TelegramIcon color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() => navigate('/profile')}
                      >
                        Отмена
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={formSubmitting || isSubmitting}
                        startIcon={formSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                      >
                        Сохранить изменения
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

export default EditProfilePage; 