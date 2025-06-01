package service

import (
	"context"
	"designhub/internal/models"
	"designhub/internal/repository"
	"fmt"
	"time"
)

type CommentService struct {
	commentRepo repository.Comment
	userRepo    repository.User
}

func NewCommentService(commentRepo repository.Comment, userRepo repository.User) *CommentService {
	return &CommentService{
		commentRepo: commentRepo,
		userRepo:    userRepo,
	}
}

// Create создает новый комментарий
func (s *CommentService) Create(ctx context.Context, userId int, comment models.CommentCreate) (int, error) {
	// Проверяем, что пользователь существует
	_, err := s.userRepo.GetByID(ctx, userId)
	if err != nil {
		return 0, fmt.Errorf("user not found: %w", err)
	}

	// Создаем комментарий
	newComment := models.Comment{
		UserID:    userId,
		PostID:    comment.PostID,
		Content:   comment.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return s.commentRepo.Create(ctx, newComment)
}

// GetById получает комментарий по ID
func (s *CommentService) GetByID(ctx context.Context, id int) (models.CommentResponse, error) {
	// Получаем комментарий
	comment, err := s.commentRepo.GetByID(ctx, id)
	if err != nil {
		return models.CommentResponse{}, fmt.Errorf("comment not found: %w", err)
	}

	// Получаем информацию о пользователе
	user, err := s.userRepo.GetByID(ctx, comment.UserID)
	if err != nil {
		return models.CommentResponse{}, fmt.Errorf("user not found: %w", err)
	}

	// Подготавливаем данные пользователя
	userBrief := models.UserBrief{
		ID:       user.ID,
		Username: user.Username,
		Nickname: user.Nickname,
		Avatar:   "", // По умолчанию пустая строка
	}

	// Если аватар не nil, используем его значение
	if user.Avatar != nil {
		userBrief.Avatar = *user.Avatar
	}

	// Конвертируем в ответ
	response := models.CommentResponse{
		ID:        comment.ID,
		Content:   comment.Content,
		CreatedAt: comment.CreatedAt,
		PostID:    comment.PostID,
		User:      userBrief,
	}

	return response, nil
}

// GetByPostId получает все комментарии к посту
func (s *CommentService) GetByPostID(ctx context.Context, postId int) ([]models.CommentResponse, error) {
	// Получаем комментарии к посту
	comments, err := s.commentRepo.GetByPostID(ctx, postId)
	if err != nil {
		return nil, fmt.Errorf("failed to get comments: %w", err)
	}

	// Конвертируем в ответ
	response := make([]models.CommentResponse, 0, len(comments))
	for _, comment := range comments {
		// Получаем информацию о пользователе
		user, err := s.userRepo.GetByID(ctx, comment.UserID)
		if err != nil {
			return nil, fmt.Errorf("user not found: %w", err)
		}

		// Подготавливаем данные пользователя
		userBrief := models.UserBrief{
			ID:       user.ID,
			Username: user.Username,
			Nickname: user.Nickname,
			Avatar:   "", // По умолчанию пустая строка
		}

		// Если аватар не nil, используем его значение
		if user.Avatar != nil {
			userBrief.Avatar = *user.Avatar
		}

		// Добавляем комментарий в ответ
		response = append(response, models.CommentResponse{
			ID:        comment.ID,
			Content:   comment.Content,
			CreatedAt: comment.CreatedAt,
			PostID:    comment.PostID,
			User:      userBrief,
		})
	}

	return response, nil
}

// Update обновляет комментарий
func (s *CommentService) Update(ctx context.Context, id int, userId int, commentUpdate models.CommentUpdate) error {
	// Получаем комментарий
	comment, err := s.commentRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("comment not found: %w", err)
	}

	// Проверяем, что пользователь - автор комментария или модератор
	if comment.UserID != userId {
		user, err := s.userRepo.GetByID(ctx, userId)
		if err != nil || (user.Role != "moderator" && user.Role != "admin") {
			return fmt.Errorf("доступ запрещен")
		}
	}

	// Обновляем комментарий
	return s.commentRepo.Update(ctx, id, commentUpdate)
}

// Delete удаляет комментарий
func (s *CommentService) Delete(ctx context.Context, id int, userId int) error {
	// Получаем комментарий
	comment, err := s.commentRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("comment not found: %w", err)
	}

	// Проверяем, что пользователь - автор комментария или модератор
	if comment.UserID != userId {
		user, err := s.userRepo.GetByID(ctx, userId)
		if err != nil || (user.Role != "moderator" && user.Role != "admin") {
			return fmt.Errorf("доступ запрещен")
		}
	}

	// Удаляем комментарий
	return s.commentRepo.Delete(ctx, id)
}
