import axios from 'axios';

// Создание экземпляра Axios с настройками по умолчанию
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  // Убираем глобальный Content-Type, чтобы он не конфликтовал с FormData
  // headers: {
  //   'Content-Type': 'application/json',
  // },
  // Следовать перенаправлениям
  maxRedirects: 5,
});

// Добавляем перехватчик запросов
api.interceptors.request.use(
  (config) => {
    // Добавляем Content-Type: application/json только если не FormData
    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем перехватчик ответов
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Обработка ошибок ответа
    if (error.response) {
      // Если статус 401 (неавторизован), очищаем токен и перенаправляем на страницу входа
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        // Если это не запрос на авторизацию, перенаправляем на страницу входа
        if (!error.config.url.includes('/auth/')) {
          window.location.href = '/login';
        }
      }
      
      // Преобразуем ошибки сервера в понятное сообщение
      const message = error.response.data?.message || 'Произошла ошибка на сервере';
      error.message = message;
    } else if (error.request) {
      // Если нет ответа от сервера
      error.message = 'Нет ответа от сервера. Проверьте подключение к интернету.';
    }
    
    return Promise.reject(error);
  }
);

export default api; 