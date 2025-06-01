import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const ModeratorRoute = () => {
  const { currentUser, loading, isModerator } = useAuth();
  
  // Пока загружаются данные пользователя, показываем индикатор загрузки
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Если пользователь не модератор, показываем сообщение о доступе
  if (!isModerator()) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 'calc(100vh - 120px)',
          padding: 3
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Доступ ограничен
        </Typography>
        <Typography variant="body1" align="center">
          У вас нет разрешения для доступа к этой странице. 
          Данный раздел доступен только модераторам.
        </Typography>
      </Box>
    );
  }

  // Если пользователь модератор, показываем дочерние компоненты
  return <Outlet />;
};

export default ModeratorRoute; 