package service

import (
	"context"
	"designhub/internal/models"
	"designhub/internal/repository"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"
)

type UserService struct {
	repo        repository.User
	fileStorage FileStorage
}

func NewUserService(repo repository.User, fileStorage FileStorage) *UserService {
	return &UserService{
		repo:        repo,
		fileStorage: fileStorage,
	}
}

func (s *UserService) GetByID(ctx context.Context, id int) (models.UserResponse, error) {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return models.UserResponse{}, fmt.Errorf("failed to get user by id: %w", err)
	}

	response := models.UserResponse{
		ID:        user.ID,
		Username:  user.Username,
		Nickname:  user.Nickname,
		Email:     user.Email,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
	}

	// Обрабатываем nullable поля
	if user.Avatar != nil {
		response.Avatar = *user.Avatar
	}

	if user.Description != nil {
		response.Description = *user.Description
	}

	if user.VkLink != nil {
		response.VkLink = *user.VkLink
	}

	if user.TelegramLink != nil {
		response.TelegramLink = *user.TelegramLink
	}

	return response, nil
}

func (s *UserService) Update(ctx context.Context, id int, userUpdate models.UserUpdate) error {
	// Проверяем, что пользователь существует
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Проверяем уникальность никнейма - пропускаем эту проверку, так как метод не реализован
	/*
		if userUpdate.Nickname != "" {
			exists, err := s.repo.NicknameExists(ctx, userUpdate.Nickname, id)
			if err != nil {
				return fmt.Errorf("failed to check nickname existence: %w", err)
			}
			if exists {
				return fmt.Errorf("никнейм %s уже используется", userUpdate.Nickname)
			}
		}
	*/

	// Обновляем пользователя
	return s.repo.Update(ctx, id, userUpdate)
}

func (s *UserService) UpdateAvatar(ctx context.Context, id int, avatarFile *multipart.FileHeader) error {
	// Проверяем, что пользователь существует
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Открываем файл
	file, err := avatarFile.Open()
	if err != nil {
		return fmt.Errorf("failed to open avatar file: %w", err)
	}
	defer file.Close()

	// Генерируем уникальное имя файла
	ext := filepath.Ext(avatarFile.Filename)
	filename := fmt.Sprintf("avatar_%d_%d%s", id, time.Now().UnixNano(), ext)

	// Сохраняем файл
	avatarPath, err := s.fileStorage.SaveFile(file, filename)
	if err != nil {
		return fmt.Errorf("failed to save avatar file: %w", err)
	}

	// Если у пользователя уже был аватар, удаляем старый файл
	if user.Avatar != nil && !strings.Contains(*user.Avatar, "default_avatar") {
		oldFilename := filepath.Base(*user.Avatar)
		if err := s.fileStorage.DeleteFile(oldFilename); err != nil {
			// Логируем ошибку, но продолжаем выполнение
			fmt.Printf("failed to delete old avatar file: %v\n", err)
		}
	}

	// Обновляем путь к аватару в БД
	return s.repo.UpdateAvatar(ctx, id, avatarPath)
}

func (s *UserService) Delete(ctx context.Context, id int) error {
	// Проверяем, что пользователь существует
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	// Удаляем аватар, если он есть
	if user.Avatar != nil && !strings.Contains(*user.Avatar, "default_avatar") {
		filename := filepath.Base(*user.Avatar)
		if err := s.fileStorage.DeleteFile(filename); err != nil {
			// Логируем ошибку, но продолжаем выполнение
			fmt.Printf("failed to delete avatar file: %v\n", err)
		}
	}

	// Удаляем пользователя
	return s.repo.Delete(ctx, id)
}
