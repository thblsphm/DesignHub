import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Link, 
  Stack,
  IconButton,
  Divider
} from '@mui/material';
import {
  Copyright as CopyrightIcon,
  Telegram as TelegramIcon
} from '@mui/icons-material';
import SvgIcon from '@mui/material/SvgIcon';

// Создаем иконку ВКонтакте (так как нет готовой в MUI)
const VkIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M21.579 6.855c.14-.465 0-.806-.666-.806h-2.199c-.561 0-.82.293-.961.612 0 0-1.123 2.727-2.713 4.5-.514.513-.748.677-1.028.677-.14 0-.343-.164-.343-.63V6.855c0-.562-.161-.806-.626-.806H9.642c-.348 0-.558.26-.558.507 0 .532.791.654.871 2.15v3.254c0 .711-.13.84-.414.84-.749 0-2.569-2.736-3.646-5.87-.209-.606-.42-.811-.982-.811H2.715c-.625 0-.75.293-.75.612 0 .573.747 3.403 3.476 7.151 1.821 2.553 4.38 3.938 6.706 3.938 1.397 0 1.568-.312 1.568-.85v-1.962c0-.625.132-.75.572-.75.325 0 .883.164 2.184 1.417 1.486 1.476 1.732 2.145 2.567 2.145h2.199c.625 0 .937-.312.757-.929-.197-.611-.905-1.494-1.845-2.543-.51-.601-1.275-1.247-1.51-1.568-.324-.417-.231-.602 0-.973.001 0 2.672-3.759 2.95-5.035z" />
  </SvgIcon>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                component="img"
                src="/logo.png"
                alt="DesignHub Logo"
                sx={{ 
                  height: 32, 
                  marginRight: 1 
                }}
              />
              <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                DesignHub
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Платформа для публикации и оценки дизайнерских работ.
              Делитесь своими творениями и находите вдохновение в работах других дизайнеров.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom sx={{ fontWeight: 600 }}>
              Навигация
            </Typography>
            <Divider sx={{ width: '40px', mb: 2, borderColor: 'primary.main', borderWidth: 2 }} />
            <Stack>
              <Link component={RouterLink} to="/" color="text.secondary" sx={{ mb: 1, '&:hover': { color: 'primary.main' } }}>
                Главная
              </Link>
              <Link component={RouterLink} to="/posts" color="text.secondary" sx={{ mb: 1, '&:hover': { color: 'primary.main' } }}>
                Галерея работ
              </Link>
              <Link component={RouterLink} to="/login" color="text.secondary" sx={{ mb: 1, '&:hover': { color: 'primary.main' } }}>
                Вход
              </Link>
              <Link component={RouterLink} to="/register" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>
                Регистрация
              </Link>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom sx={{ fontWeight: 600 }}>
              Свяжитесь с нами
            </Typography>
            <Divider sx={{ width: '40px', mb: 2, borderColor: 'primary.main', borderWidth: 2 }} />
            <Typography variant="body2" color="text.secondary" paragraph>
              Есть вопросы или предложения? Напишите нам!
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton aria-label="vkontakte" color="primary" sx={{ 
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
              }}>
                <VkIcon />
              </IconButton>
              <IconButton aria-label="telegram" color="primary" sx={{ 
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
              }}>
                <TelegramIcon />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 5, borderTop: '1px solid', borderColor: 'divider', pt: 3 }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CopyrightIcon fontSize="small" sx={{ mr: 0.5 }} />
            {currentYear} | DesignHub - Все права защищены
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 