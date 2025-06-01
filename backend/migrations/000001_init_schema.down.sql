-- Удаление триггера
DROP TRIGGER IF EXISTS update_post_likes_count ON likes;

-- Удаление триггерной функции
DROP FUNCTION IF EXISTS update_likes_count();

-- Удаление таблиц
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users; 