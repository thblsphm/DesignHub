import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Container,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Home as HomeIcon,
  CollectionsBookmark as GalleryIcon,
  Add as AddIcon,
  AccountCircle as AccountIcon,
  Login as LoginIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  AccountCircle as ProfileIcon,
  Create as CreateIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import API_CONFIG from '../config/apiConfig';

const Header = () => {
  const { currentUser, logout, isModerator } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    if (drawerOpen) setDrawerOpen(false);
  };

  // Меню профиля для десктопа
  const menuId = 'primary-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      id={menuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem component={RouterLink} to="/profile" onClick={handleMenuClose}>
        Мой профиль
      </MenuItem>
      <MenuItem component={RouterLink} to="/profile/edit" onClick={handleMenuClose}>
        Настройки
      </MenuItem>
      {isModerator && isModerator() && (
        <MenuItem component={RouterLink} to="/moderation" onClick={handleMenuClose}>
          Модерация
        </MenuItem>
      )}
      <Divider />
      <MenuItem onClick={handleLogout}>
        Выйти
      </MenuItem>
    </Menu>
  );

  // Контент для мобильного меню
  const drawerContent = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={() => setDrawerOpen(false)}
    >
      <List>
        <ListItem component={RouterLink} to="/" button>
          <ListItemIcon>
            <HomeIcon color="primary" />
          </ListItemIcon>
          <ListItemText primary="Главная" />
        </ListItem>
        <ListItem component={RouterLink} to="/posts" button>
          <ListItemIcon>
            <GalleryIcon color="primary" />
          </ListItemIcon>
          <ListItemText primary="Галерея работ" />
        </ListItem>
        {currentUser && (
          <ListItem component={RouterLink} to="/create-post" button>
            <ListItemIcon>
              <AddIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Создать пост" />
          </ListItem>
        )}
      </List>
      <Divider />
      <List>
        {currentUser ? (
          <>
            <ListItem component={RouterLink} to="/profile" button>
              <ListItemIcon>
                <AccountIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Мой профиль" />
            </ListItem>
            {isModerator && isModerator() && (
              <ListItem component={RouterLink} to="/moderation" button>
                <ListItemIcon>
                  <AdminIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Модерация" />
              </ListItem>
            )}
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Выйти" />
            </ListItem>
          </>
        ) : (
          <ListItem component={RouterLink} to="/login" button>
            <ListItemIcon>
              <LoginIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Войти" />
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Container>
          <Toolbar disableGutters>
            {isMobile && (
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Box
              component={RouterLink}
              to="/"
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="DesignHub Logo"
                sx={{ 
                  height: 40, 
                  marginRight: 1,
                  display: { xs: drawerOpen ? 'none' : 'block', sm: 'block' }
                }}
              />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  display: { xs: drawerOpen ? 'none' : 'block', sm: 'block' },
                  fontWeight: 700
                }}
              >
                DesignHub
              </Typography>
            </Box>

            {!isMobile && (
              <Box sx={{ flexGrow: 1, display: 'flex', ml: 4 }}>
                <Button
                  component={RouterLink}
                  to="/"
                  sx={{ my: 2, color: 'text.primary', display: 'block' }}
                >
                  Главная
                </Button>
                <Button
                  component={RouterLink}
                  to="/posts"
                  sx={{ my: 2, color: 'text.primary', display: 'block' }}
                >
                  Галерея работ
                </Button>
                {currentUser && (
                  <Button
                    component={RouterLink}
                    to="/create-post"
                    sx={{ my: 2, color: 'text.primary', display: 'block' }}
                  >
                    Создать пост
                  </Button>
                )}
              </Box>
            )}

            <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

            <Box sx={{ display: 'flex' }}>
              {currentUser ? (
                <IconButton
                  size="large"
                  edge="end"
                  aria-label="account of current user"
                  aria-controls={menuId}
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                >
                  {currentUser.avatar ? (
                    <Avatar 
                      src={API_CONFIG.getMediaUrl(currentUser.avatar)} 
                      alt={currentUser.username}
                      sx={{ width: 35, height: 35 }}
                    />
                  ) : (
                    <Avatar sx={{ width: 35, height: 35, bgcolor: 'primary.main' }}>
                      {currentUser.username?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  )}
                </IconButton>
              ) : (
                <Button
                  component={RouterLink}
                  to="/login"
                  color="primary"
                  variant="contained"
                  startIcon={<LoginIcon />}
                >
                  Войти
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      {renderMenu}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Header; 