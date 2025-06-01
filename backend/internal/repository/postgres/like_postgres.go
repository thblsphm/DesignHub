package postgres

import (
	"context"
	"designhub/internal/models"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type LikePostgres struct {
	db *sqlx.DB
}

func NewLikePostgres(db *sqlx.DB) *LikePostgres {
	return &LikePostgres{db: db}
}

// Create создает новый лайк
func (r *LikePostgres) Create(ctx context.Context, like models.Like) (int, error) {
	var id int

	query := `
		INSERT INTO likes 
		(user_id, post_id, created_at) 
		VALUES 
		($1, $2, $3)
		RETURNING id
	`

	row := r.db.QueryRowContext(
		ctx,
		query,
		like.UserID,
		like.PostID,
		like.CreatedAt,
	)

	if err := row.Scan(&id); err != nil {
		return 0, fmt.Errorf("failed to create like: %w", err)
	}

	return id, nil
}

// GetByID получает лайк по ID
func (r *LikePostgres) GetByID(ctx context.Context, id int) (models.Like, error) {
	var like models.Like

	query := `
		SELECT id, user_id, post_id, created_at
		FROM likes 
		WHERE id = $1
	`

	if err := r.db.GetContext(ctx, &like, query, id); err != nil {
		return models.Like{}, fmt.Errorf("like not found: %w", err)
	}

	return like, nil
}

// GetByPostIDAndUserID получает лайк по ID поста и ID пользователя
func (r *LikePostgres) GetByPostIDAndUserID(ctx context.Context, postID, userID int) (models.Like, error) {
	var like models.Like

	query := `
		SELECT id, user_id, post_id, created_at
		FROM likes 
		WHERE post_id = $1 AND user_id = $2
	`

	if err := r.db.GetContext(ctx, &like, query, postID, userID); err != nil {
		return models.Like{}, fmt.Errorf("like not found: %w", err)
	}

	return like, nil
}

// IsLiked проверяет, лайкнул ли пользователь пост
func (r *LikePostgres) IsLiked(ctx context.Context, postID, userID int) (bool, error) {
	var count int

	query := `
		SELECT COUNT(*) 
		FROM likes 
		WHERE post_id = $1 AND user_id = $2
	`

	if err := r.db.GetContext(ctx, &count, query, postID, userID); err != nil {
		return false, fmt.Errorf("failed to check if post is liked: %w", err)
	}

	return count > 0, nil
}

// CountByPostID получает количество лайков у поста
func (r *LikePostgres) CountByPostID(ctx context.Context, postID int) (int, error) {
	var count int

	query := `
		SELECT COUNT(*) 
		FROM likes 
		WHERE post_id = $1
	`

	if err := r.db.GetContext(ctx, &count, query, postID); err != nil {
		return 0, fmt.Errorf("failed to count likes: %w", err)
	}

	return count, nil
}

// Delete удаляет лайк по ID
func (r *LikePostgres) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM likes WHERE id = $1`

	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete like: %w", err)
	}

	return nil
}

// DeleteByPostIDAndUserID удаляет лайк по ID поста и ID пользователя
func (r *LikePostgres) DeleteByPostIDAndUserID(ctx context.Context, postID, userID int) error {
	query := `DELETE FROM likes WHERE post_id = $1 AND user_id = $2`

	_, err := r.db.ExecContext(ctx, query, postID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete like: %w", err)
	}

	return nil
}
