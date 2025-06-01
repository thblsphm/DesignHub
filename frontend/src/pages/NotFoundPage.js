import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFoundPage = () => {
  return (
    <Container>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 200px)',
          textAlign: 'center',
          py: 5,
        }}
      >
        <Typography
          variant="h1"
          color="primary"
          sx={{
            fontSize: { xs: '6rem', md: '10rem' },
            fontWeight: 700,
            mb: 2,
          }}
        >
          404
        </Typography>
        
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 600, mb: 3 }}
        >
          Страница не найдена
        </Typography>
        
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 600, mb: 4 }}
        >
          К сожалению, страница, которую вы ищете, не существует или была перемещена.
          Возможно, вы ввели неправильный адрес или страница устарела.
        </Typography>
        
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          color="primary"
          startIcon={<HomeIcon />}
          size="large"
          sx={{ px: 4, py: 1.2 }}
        >
          Вернуться на главную
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage; 