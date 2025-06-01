import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
  Link, 
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { 
  AccountCircle as AccountIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  LockOutlined as LockIcon,
  Visibility, 
  VisibilityOff,
  HowToReg as RegisterIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon
} from '@mui/icons-material';

// Единая схема валидации для всей формы
const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Имя должно содержать минимум 3 символа')
    .max(50, 'Имя должно содержать максимум 50 символов')
    .required('Имя обязательно'),
  nickname: Yup.string()
    .min(3, 'Никнейм должен содержать минимум 3 символа')
    .max(50, 'Никнейм должен содержать максимум 50 символов')
    .matches(/^[a-zA-Z0-9_.]+$/, 'Никнейм может содержать только буквы, цифры, точки и подчеркивания')
    .required('Никнейм обязателен'),
  email: Yup.string()
    .email('Введите действительный email')
    .required('Email обязателен'),
  password: Yup.string()
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .max(64, 'Пароль должен содержать максимум 64 символа')
    .required('Пароль обязателен'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Пароли должны совпадать')
    .required('Подтверждение пароля обязательно'),
});

const steps = ['Основная информация', 'Учетные данные'];

const RegisterPage = () => {
  const { register, error } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Объединенное состояние для всей формы
  const [allFormData, setAllFormData] = useState({
    username: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Функция для валидации только полей первого шага
  const validateFirstStep = () => {
    try {
      // Валидируем только поля первого шага
      Yup.object({
        username: RegisterSchema.fields.username,
        nickname: RegisterSchema.fields.nickname
      }).validateSync({
        username: allFormData.username,
        nickname: allFormData.nickname
      }, { abortEarly: false });
      return true;
    } catch (err) {
      return false;
    }
  };

  // Функция для валидации только полей второго шага
  const validateSecondStep = () => {
    try {
      // Валидируем только поля второго шага
      Yup.object({
        email: RegisterSchema.fields.email,
        password: RegisterSchema.fields.password,
        confirmPassword: RegisterSchema.fields.confirmPassword
      }).validateSync({
        email: allFormData.email,
        password: allFormData.password,
        confirmPassword: allFormData.confirmPassword
      }, { abortEarly: false });
      return true;
    } catch (err) {
      return false;
    }
  };

  // Обработчик изменений полей формы
  const handleFieldChange = (field, value) => {
    setAllFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Переход к следующему шагу
  const handleNext = () => {
    if (validateFirstStep()) {
      setActiveStep(1);
    }
  };

  // Переход к предыдущему шагу
  const handleBack = () => {
    setActiveStep(0);
  };

  // Отправка формы
  const handleSubmit = async () => {
    if (validateFirstStep() && validateSecondStep()) {
      const registerData = {
        username: allFormData.username,
        nickname: allFormData.nickname,
        email: allFormData.email,
        password: allFormData.password,
        confirm_password: allFormData.confirmPassword
      };
      
      const success = await register(registerData);
      if (success) {
        navigate('/login');
      }
    }
  };

  // Проверка активации кнопки для первого шага
  const isNextButtonEnabled = () => {
    return allFormData.username.length >= 3 && 
           allFormData.nickname.length >= 3 &&
           /^[a-zA-Z0-9_.]+$/.test(allFormData.nickname);
  };

  // Проверка активации кнопки для второго шага
  const isRegisterButtonEnabled = () => {
    return validateSecondStep() && 
           allFormData.email.length > 0 && 
           allFormData.password.length >= 6 &&
           allFormData.password === allFormData.confirmPassword;
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: { xs: 4, md: 6 }, mb: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Регистрация
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
            Создайте аккаунт, чтобы публиковать работы и взаимодействовать с сообществом дизайнеров
          </Typography>
          
          <Stepper activeStep={activeStep} alternativeLabel sx={{ width: '100%', mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {activeStep === 0 ? (
            <Box component="form" style={{ width: '100%' }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="username"
                    name="username"
                    label="Имя"
                    variant="outlined"
                    value={allFormData.username}
                    onChange={(e) => handleFieldChange('username', e.target.value)}
                    error={allFormData.username.length > 0 && allFormData.username.length < 3}
                    helperText={
                      allFormData.username.length > 0 && allFormData.username.length < 3 
                        ? 'Имя должно содержать минимум 3 символа' 
                        : ''
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="nickname"
                    name="nickname"
                    label="Никнейм"
                    variant="outlined"
                    value={allFormData.nickname}
                    onChange={(e) => handleFieldChange('nickname', e.target.value)}
                    error={
                      (allFormData.nickname.length > 0 && allFormData.nickname.length < 3) ||
                      (allFormData.nickname.length > 0 && !/^[a-zA-Z0-9_.]+$/.test(allFormData.nickname))
                    }
                    helperText={
                      allFormData.nickname.length > 0 && allFormData.nickname.length < 3 
                        ? 'Никнейм должен содержать минимум 3 символа'
                        : allFormData.nickname.length > 0 && !/^[a-zA-Z0-9_.]+$/.test(allFormData.nickname)
                          ? 'Никнейм может содержать только буквы, цифры, точки и подчеркивания'
                          : ''
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              
              <Button
                fullWidth
                variant="contained"
                color="primary"
                disabled={!isNextButtonEnabled()}
                endIcon={<NextIcon />}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                onClick={handleNext}
              >
                Далее
              </Button>
              
              <Grid container justifyContent="center">
                <Grid item>
                  <Typography variant="body2" align="center">
                    Уже есть аккаунт?{' '}
                    <Link component={RouterLink} to="/login" variant="body2" color="primary">
                      Войти
                    </Link>
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box component="form" style={{ width: '100%' }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email"
                    variant="outlined"
                    value={allFormData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    error={allFormData.email.length > 0 && !(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(allFormData.email))}
                    helperText={
                      allFormData.email.length > 0 && !(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(allFormData.email))
                        ? 'Введите действительный email'
                        : ''
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label="Пароль"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={allFormData.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    error={allFormData.password.length > 0 && allFormData.password.length < 6}
                    helperText={
                      allFormData.password.length > 0 && allFormData.password.length < 6
                        ? 'Пароль должен содержать минимум 6 символов'
                        : ''
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Подтверждение пароля"
                    type={showConfirmPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={allFormData.confirmPassword}
                    onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                    error={
                      allFormData.confirmPassword.length > 0 && 
                      allFormData.password !== allFormData.confirmPassword
                    }
                    helperText={
                      allFormData.confirmPassword.length > 0 && 
                      allFormData.password !== allFormData.confirmPassword
                        ? 'Пароли должны совпадать'
                        : ''
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowConfirmPassword}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  startIcon={<BackIcon />}
                  sx={{ py: 1.5, px: 3 }}
                >
                  Назад
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!isRegisterButtonEnabled()}
                  startIcon={<RegisterIcon />}
                  sx={{ py: 1.5, px: 3 }}
                  onClick={handleSubmit}
                >
                  Зарегистрироваться
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage; 