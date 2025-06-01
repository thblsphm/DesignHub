import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  Stack,
  Divider,
  Paper,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  CollectionsBookmark as GalleryIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import API_CONFIG from '../config/apiConfig';
import api from '../api/api';

const categories = [
  {
    id: 1,
    name: 'UX/UI Дизайн',
    description: 'Проектирование интерфейсов и взаимодействия с пользователем',
    slug: 'ux-ui',
    image: '/static/images/categories/ux-ui.jpg',
    fallbackColor: '#4CAF50'
  },
  {
    id: 2,
    name: 'Графический дизайн',
    description: 'Логотипы, брендинг, полиграфия и другие визуальные материалы',
    slug: 'graphic-design',
    image: '/static/images/categories/graphic-design.jpg',
    fallbackColor: '#2196F3'
  },
  {
    id: 3,
    name: '3D Дизайн',
    description: 'Трехмерные объекты, сцены и анимации',
    slug: '3d-design',
    image: '/static/images/categories/3d-design.jpg',
    fallbackColor: '#9C27B0'
  },
  {
    id: 4,
    name: 'Иллюстрация',
    description: 'Рисунки, картины и другие художественные работы',
    slug: 'illustration',
    image: '/static/images/categories/illustration.jpg',
    fallbackColor: '#FF9800'
  },
];

const featureData = [
  {
    title: 'Публикуйте',
    description: 'Загружайте фото и видео ваших работ всего в несколько кликов. Добавляйте описание и выбирайте подходящие категории.'
  },
  {
    title: 'Находите',
    description: 'Используйте фильтры и поиск для нахождения работ, которые вас вдохновляют. Сохраняйте понравившиеся работы в избранное.'
  },
  {
    title: 'Общайтесь',
    description: 'Обменивайтесь мнениями через комментарии. Подписывайтесь на профили талантливых дизайнеров.'
  },
  {
    title: 'Развивайтесь',
    description: 'Получайте конструктивную обратную связь от сообщества. Используйте критику для улучшения своих навыков.'
  }
];

const HomePage = () => {
  const { currentUser } = useAuth();
  const [randomUsers, setRandomUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Загрузка случайных пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        // Получим несколько пользователей по известным ID
        // Так как на бэкенде нет эндпоинта для получения всех пользователей
        // Используем известные ID пользователей на площадке
        const userIds = [1, 2, 3]; // Здесь указываем ID существующих пользователей
        const userPromises = userIds.map(id => 
          api.get(`/api/v1/public/users/${id}`)
            .then(response => response.data)
            .catch(error => {
              console.error(`Ошибка при загрузке пользователя с ID ${id}:`, error);
              return null;
            })
        );
        
        const results = await Promise.allSettled(userPromises);
        const validUsers = results
          .filter(result => result.status === 'fulfilled' && result.value)
          .map(result => result.value);
        
        setRandomUsers(validUsers);
      } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
        setRandomUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <Box>
      {/* Hero секция */}
      <Box 
        sx={{ 
          position: 'relative',
          height: { xs: '60vh', md: '80vh' },
          overflow: 'hidden',
          mb: 8
        }}
      >
        <Box
          component="img"
          src="/hero-bg.png"
          alt="DesignHub Hero"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.5)'
          }}
        />
        <Container 
          maxWidth="md" 
          sx={{ 
            position: 'relative', 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'center',
            zIndex: 1
          }}
        >
          <Typography
            variant="h1"
            color="white"
            gutterBottom
            sx={{ 
              fontSize: { xs: '2.5rem', md: '4rem' },
              fontWeight: 700,
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            ПУБЛИКУЙ И НАХОДИ
          </Typography>
          <Typography
            variant="h2"
            color="primary"
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.5rem', md: '2.5rem' },
              fontWeight: 700,
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              mb: 4
            }}
          >
            ЛУЧШИЕ ДИЗАЙНЕРСКИЕ РАБОТЫ
          </Typography>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              component={RouterLink}
              to="/posts"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<GalleryIcon />}
              sx={{ py: 1.5, px: 3, fontSize: '1rem' }}
            >
              Смотреть галерею
            </Button>
            {currentUser ? (
              <Button
                component={RouterLink}
                to="/create-post"
                variant="outlined"
                color="primary"
                size="large"
                startIcon={<AddIcon />}
                sx={{ 
                  py: 1.5, 
                  px: 3, 
                  fontSize: '1rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
              >
                Добавить работу
              </Button>
            ) : (
              <Button
                component={RouterLink}
                to="/register"
                variant="outlined"
                color="primary"
                size="large"
                sx={{ 
                  py: 1.5, 
                  px: 3, 
                  fontSize: '1rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
              >
                Зарегистрироваться
              </Button>
            )}
          </Stack>
        </Container>
      </Box>

      {/* Разделитель */}
      <div className="page-divider"></div>

      {/* Секция категорий */}
      <Container sx={{ mb: 8 }}>
        <Typography 
          variant="h2" 
          align="center" 
          color="textPrimary" 
          gutterBottom
          sx={{ fontWeight: 700, mb: 4 }}
        >
          ЛУЧШЕЕ ЗА НЕДЕЛЮ
        </Typography>
        <Grid container spacing={4}>
          {categories.map((category, index) => (
            <Grid item key={index} xs={12} sm={6} md={3}>
              <Card 
                className="card-hover"
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column' 
                }}
              >
                <CardMedia
                  component="div"
                  sx={{ 
                    height: 180, 
                    backgroundColor: category.fallbackColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography 
                    variant="h4" 
                    component="div" 
                    align="center" 
                    color="white" 
                    sx={{ 
                      zIndex: 1, 
                      fontWeight: 'bold',
                      textShadow: '1px 1px 3px rgba(0,0,0,0.7)'
                    }}
                  >
                    {category.name}
                  </Typography>
                </CardMedia>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {category.name}
                  </Typography>
                  <Typography>
                    {category.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    component={RouterLink} 
                    to={`/posts?category=${category.slug}`} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                    fullWidth
                  >
                    Смотреть работы
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            component={RouterLink}
            to="/posts"
            variant="contained"
            color="primary"
            size="large"
          >
            Смотреть все
          </Button>
        </Box>
      </Container>

      {/* Разделитель */}
      <div className="page-divider"></div>

      {/* Секция дизайнеров */}
      <Box sx={{ py: 8, backgroundColor: 'background.paper' }}>
        <Container>
          <Typography 
            variant="h2" 
            align="center" 
            color="textPrimary" 
            gutterBottom
            sx={{ fontWeight: 700, mb: 4 }}
          >
            ДИЗАЙНЕРЫ
          </Typography>
          <Typography 
            variant="h5" 
            align="center" 
            color="textSecondary" 
            paragraph
            sx={{ mb: 6 }}
          >
            Присоединяйтесь к сообществу талантливых дизайнеров со всего мира
          </Typography>

          <Grid container spacing={2} justifyContent="center">
            {loadingUsers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : randomUsers.length > 0 ? (
              randomUsers.map((user) => (
                <Grid item key={user.id} xs={12} sm={6} md={4}>
                  <Paper
                    className="card-hover"
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: 4
                    }}
                  >
                    <Avatar
                      src={user.avatar ? API_CONFIG.getMediaUrl(user.avatar) : `https://ui-avatars.com/api/?name=${user.nickname}&background=random`}
                      alt={user.nickname}
                      sx={{
                        width: 120,
                        height: 120,
                        mb: 3,
                        boxShadow: 3
                      }}
                    />
                    <Typography variant="h5" gutterBottom>
                      {user.nickname}
                    </Typography>
                    {user.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {user.description}
                      </Typography>
                    )}
                    <Button
                      component={RouterLink}
                      to={`/users/${user.id}`}
                      variant="outlined"
                      color="primary"
                      sx={{ mt: 2 }}
                    >
                      Подробнее
                    </Button>
                  </Paper>
                </Grid>
              ))
            ) : (
              // Запасной вариант, если нет пользователей или ошибка загрузки
              [1, 2, 3].map((item) => (
                <Grid item key={item} xs={12} sm={6} md={4}>
                  <Paper
                    className="card-hover"
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: 4
                    }}
                  >
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        mb: 3,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    />
                    <Typography variant="h5" gutterBottom>
                      Присоединяйтесь
                    </Typography>
                    <Button
                      component={RouterLink}
                      to="/register"
                      variant="outlined"
                      color="primary"
                      sx={{ mt: 2 }}
                    >
                      Регистрация
                    </Button>
                  </Paper>
                </Grid>
              ))
            )}
          </Grid>
        </Container>
      </Box>

      {/* Разделитель */}
      <div className="page-divider"></div>

      {/* Секция возможностей */}
      <Container sx={{ py: 8 }}>
        <Typography 
          variant="h2" 
          align="center" 
          color="textPrimary" 
          gutterBottom
          sx={{ fontWeight: 700, mb: 6 }}
        >
          ВОЗМОЖНОСТИ ПЛАТФОРМЫ
        </Typography>

        <Grid container spacing={4}>
          {featureData.map((feature, index) => (
            <Grid item key={index} xs={12} sm={6} md={3}>
              <Paper
                elevation={2}
                sx={{ 
                  p: 3, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)'
                  }
                }}
              >
                <Typography variant="h5" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1" sx={{ flexGrow: 1 }}>
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA секция */}
      <Box sx={{ py: 8, bgcolor: 'primary.main' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ color: 'white', fontWeight: 700 }}
          >
            ПРИСОЕДИНЯЙТЕСЬ К СООБЩЕСТВУ ДИЗАЙНЕРОВ УЖЕ СЕГОДНЯ
          </Typography>
          <Button
            component={RouterLink}
            to="/register"
            variant="contained"
            size="large"
            sx={{ 
              mt: 4, 
              px: 6, 
              py: 2, 
              fontSize: '1.2rem',
              fontWeight: 600,
              backgroundColor: 'white',
              color: 'primary.main',
              borderRadius: '30px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                transform: 'scale(1.05)',
                transition: 'transform 0.3s',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
              }
            }}
          >
            Зарегистрировать свой аккаунт
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage; 