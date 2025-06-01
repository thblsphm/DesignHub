/**
 * Форматирует дату в читаемый вид
 * @param {Date} date Объект даты для форматирования
 * @returns {string} Отформатированная строка даты
 */
export const formatDate = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
    return 'Неверная дата';
  }

  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Если прошло менее часа
  if (hours < 1) {
    if (minutes < 1) {
      return 'только что';
    }
    return `${minutes} ${getPlural(minutes, 'минута', 'минуты', 'минут')} назад`;
  }

  // Если прошло менее суток
  if (days < 1) {
    return `${hours} ${getPlural(hours, 'час', 'часа', 'часов')} назад`;
  }

  // Если прошло менее недели
  if (days < 7) {
    return `${days} ${getPlural(days, 'день', 'дня', 'дней')} назад`;
  }

  // В остальных случаях выводим полную дату
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Возвращает правильную форму слова с учетом числительного
 * @param {number} count Число
 * @param {string} one Форма для "1"
 * @param {string} few Форма для "2-4"
 * @param {string} many Форма для "5-20"
 * @returns {string} Правильная форма слова
 */
function getPlural(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 20) {
    return many;
  }

  if (mod10 === 1) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }

  return many;
} 