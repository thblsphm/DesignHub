import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/api';
import API_CONFIG from '../config/apiConfig';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функция для установки токена в заголовки API
  const setAuthToken = (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // Функция получения данных текущего пользователя
  const fetchCurrentUser = async () => {
    try {
      // Всегда устанавливаем токен перед запросом
      setAuthToken(token);
      
      const response = await api.get(API_CONFIG.ROUTES.USERS.ME);
      setCurrentUser(response.data);
      console.log('Данные текущего пользователя получены', response.data);
      return response.data;
    } catch (err) {
      console.error('Ошибка при получении данных пользователя:', err);
      if (err.response && err.response.status === 401) {
        // Если сервер ответил 401, значит токен недействителен
        logout();
      }
      return null;
    }
  };

  // Проверка и обновление токена при загрузке
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Проверка валидности токена
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            // Токен истек
            console.log('Токен истёк, выполняем выход');
            logout();
          } else {
            // Устанавливаем токен в заголовки API
            setAuthToken(token);
            
            // Получаем данные пользователя
            await fetchCurrentUser();
          }
        } catch (err) {
          console.error('Error initializing auth:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  // Авторизация пользователя
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post(API_CONFIG.ROUTES.AUTH.SIGN_IN, { email, password });
      const { token } = response.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      
      // Устанавливаем токен в заголовки API
      setAuthToken(token);
      
      // Получаем данные пользователя после успешного входа
      await fetchCurrentUser();
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.message || 'Ошибка при входе в систему';
      setError(message);
      return false;
    }
  };

  // Регистрация пользователя
  const register = async (userData) => {
    try {
      setError(null);
      await api.post(API_CONFIG.ROUTES.AUTH.SIGN_UP, userData);
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      const message = err.response?.data?.message || 'Ошибка при регистрации';
      setError(message);
      return false;
    }
  };

  // Выход из системы
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setAuthToken(null);
  };

  // Обновление данных пользователя
  const updateUserProfile = async (userData) => {
    try {
      setError(null);
      // Убедимся, что токен установлен
      setAuthToken(token);
      
      const response = await api.put(API_CONFIG.ROUTES.USERS.ME, userData);
      setCurrentUser(response.data);
      return true;
    } catch (err) {
      console.error('Update profile error:', err);
      const message = err.response?.data?.message || 'Ошибка при обновлении профиля';
      setError(message);
      return false;
    }
  };

  // Обновление аватара пользователя
  const updateAvatar = async (formData) => {
    try {
      setError(null);
      // Убедимся, что токен установлен
      setAuthToken(token);
      
      const response = await api.put(API_CONFIG.ROUTES.USERS.AVATAR, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setCurrentUser(response.data);
      return true;
    } catch (err) {
      console.error('Update avatar error:', err);
      const message = err.response?.data?.message || 'Ошибка при обновлении аватара';
      setError(message);
      return false;
    }
  };

  // Проверка роли модератора
  const isModerator = () => {
    return currentUser?.role === 'moderator' || currentUser?.role === 'admin';
  };

  // Функция для принудительного обновления данных пользователя
  const refreshUserData = async () => {
    if (token) {
      // Убедимся, что токен установлен в заголовки
      setAuthToken(token);
      return await fetchCurrentUser();
    }
    return null;
  };

  // Значение контекста
  const value = {
    currentUser,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateUserProfile,
    updateAvatar,
    isModerator,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 