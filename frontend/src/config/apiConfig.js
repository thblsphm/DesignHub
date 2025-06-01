// Файл конфигурации API
const API_CONFIG = {
  // Базовый URL API
  BASE_URL: 'http://localhost:8080',
  
  // URL для медиафайлов - обновляем с учетом бэкенд маршрутизации
  MEDIA_URL: 'http://localhost:8080/media',
  
  // Настройки запросов
  REQUEST_TIMEOUT: 30000, // 30 секунд
  
  // Константы для маршрутов API
  ROUTES: {
    AUTH: {
      SIGN_IN: '/api/v1/auth/sign-in',
      SIGN_UP: '/api/v1/auth/sign-up',
    },
    USERS: {
      ME: '/api/v1/users/me',
      AVATAR: '/api/v1/users/me/avatar',
    },
    POSTS: {
      PUBLIC: '/api/v1/public/posts',
      PRIVATE: '/api/v1/posts',
    },
    CATEGORIES: {
      LIST: '/api/v1/categories/',
    },
  },
  
  // Функция для формирования полного URL медиафайла
  getMediaUrl: (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    // Проверка на прямой путь к файлу с годом и датой (формат бэкенда)
    if (path.match(/^\d{4}\/\d{2}\/\d{2}\//)) {
      return `${API_CONFIG.BASE_URL}/media/${path}`;
    }
    
    // Проверка, начинается ли путь с слеша или нет
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_CONFIG.MEDIA_URL}${formattedPath}`;
  },
};

export default API_CONFIG; 