package service

import (
	"context"
	"designhub/internal/models"
	"designhub/internal/repository"
	"fmt"
	"time"
)

type LikeService struct {
	likeRepo repository.Like
	postRepo repository.Post
}

func NewLikeService(likeRepo repository.Like, postRepo repository.Post) *LikeService {
	return &LikeService{
		likeRepo: likeRepo,
		postRepo: postRepo,
	}
}

// Create создает новый лайк
func (s *LikeService) Create(ctx context.Context, userId int, like models.LikeCreate) (int, error) {
	// Проверяем, что пост существует
	_, err := s.postRepo.GetByID(ctx, like.PostID)
	if err != nil {
		return 0, fmt.Errorf("post not found: %w", err)
	}

	// Проверяем, не лайкнул ли пользователь уже этот пост
	isLiked, err := s.likeRepo.IsLiked(ctx, like.PostID, userId)
	if err != nil {
		return 0, fmt.Errorf("failed to check if post is liked: %w", err)
	}
	if isLiked {
		return 0, fmt.Errorf("пост уже лайкнут")
	}

	// Создаем лайк
	newLike := models.Like{
		UserID:    userId,
		PostID:    like.PostID,
		CreatedAt: time.Now(),
	}

	return s.likeRepo.Create(ctx, newLike)
}

// Delete удаляет лайк
func (s *LikeService) Delete(ctx context.Context, postId int, userId int) error {
	// Проверяем, что пост существует
	_, err := s.postRepo.GetByID(ctx, postId)
	if err != nil {
		return fmt.Errorf("post not found: %w", err)
	}

	// Проверяем, лайкнул ли пользователь этот пост
	isLiked, err := s.likeRepo.IsLiked(ctx, postId, userId)
	if err != nil {
		return fmt.Errorf("failed to check if post is liked: %w", err)
	}
	if !isLiked {
		return fmt.Errorf("лайк не найден")
	}

	// Удаляем лайк
	return s.likeRepo.DeleteByPostIDAndUserID(ctx, postId, userId)
}

// IsLiked проверяет, лайкнул ли пользователь пост
func (s *LikeService) IsLiked(ctx context.Context, postId int, userId int) (bool, error) {
	return s.likeRepo.IsLiked(ctx, postId, userId)
}
