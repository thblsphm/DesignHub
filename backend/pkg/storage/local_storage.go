package storage

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// LocalStorage реализация FileStorage для локального файлового хранилища
type LocalStorage struct {
	basePath string
	baseURL  string
}

// NewLocalStorage создает новый экземпляр LocalStorage
func NewLocalStorage(basePath, baseURL string) (*LocalStorage, error) {
	if err := os.MkdirAll(basePath, 0755); err != nil {
		return nil, fmt.Errorf("cannot create base directory: %w", err)
	}

	return &LocalStorage{
		basePath: basePath,
		baseURL:  baseURL,
	}, nil
}

// SaveFile сохраняет файл в локальное хранилище
func (s *LocalStorage) SaveFile(file io.Reader, originalFilename string) (string, error) {
	// Генерируем уникальное имя файла
	fileExt := filepath.Ext(originalFilename)
	currentTime := time.Now().Format("2006/01/02")
	dirPath := filepath.Join(s.basePath, currentTime)

	// Создаем подкаталог для текущей даты
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return "", fmt.Errorf("cannot create directory: %w", err)
	}

	filename := fmt.Sprintf("%s%s", uuid.New().String(), fileExt)
	filePath := filepath.Join(dirPath, filename)

	// Создаем файл для записи
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("cannot create file: %w", err)
	}
	defer dst.Close()

	// Копируем содержимое входного файла в созданный файл
	if _, err = io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("cannot save file: %w", err)
	}

	// Возвращаем относительный путь к файлу для сохранения в БД
	relativePath := filepath.Join(currentTime, filename)
	return relativePath, nil
}

// GetFileURL возвращает публичный URL к файлу
func (s *LocalStorage) GetFileURL(filename string) string {
	return fmt.Sprintf("%s/%s", strings.TrimRight(s.baseURL, "/"), filename)
}

// DeleteFile удаляет файл из хранилища
func (s *LocalStorage) DeleteFile(filename string) error {
	filePath := filepath.Join(s.basePath, filename)

	if err := os.Remove(filePath); err != nil {
		if os.IsNotExist(err) {
			// Если файла нет, это не ошибка
			return nil
		}
		return fmt.Errorf("cannot delete file: %w", err)
	}

	return nil
}
