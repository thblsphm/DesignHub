package postgres

import (
	"context"
	"designhub/internal/models"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

type CommentPostgres struct {
	db *sqlx.DB
}

func NewCommentPostgres(db *sqlx.DB) *CommentPostgres {
	return &CommentPostgres{db: db}
}

// Create создает новый комментарий
func (r *CommentPostgres) Create(ctx context.Context, comment models.Comment) (int, error) {
	var id int

	query := `
		INSERT INTO comments 
		(user_id, post_id, content, created_at, updated_at) 
		VALUES 
		($1, $2, $3, $4, $5)
		RETURNING id
	`

	row := r.db.QueryRowContext(
		ctx,
		query,
		comment.UserID,
		comment.PostID,
		comment.Content,
		comment.CreatedAt,
		comment.UpdatedAt,
	)

	if err := row.Scan(&id); err != nil {
		return 0, fmt.Errorf("failed to create comment: %w", err)
	}

	return id, nil
}

// GetByID получает комментарий по ID
func (r *CommentPostgres) GetByID(ctx context.Context, id int) (models.Comment, error) {
	var comment models.Comment

	query := `
		SELECT id, user_id, post_id, content, created_at, updated_at
		FROM comments 
		WHERE id = $1
	`

	if err := r.db.GetContext(ctx, &comment, query, id); err != nil {
		return models.Comment{}, fmt.Errorf("comment not found: %w", err)
	}

	return comment, nil
}

// GetByPostID получает все комментарии к посту
func (r *CommentPostgres) GetByPostID(ctx context.Context, postID int) ([]models.Comment, error) {
	var comments []models.Comment

	query := `
		SELECT id, user_id, post_id, content, created_at, updated_at
		FROM comments 
		WHERE post_id = $1
		ORDER BY created_at ASC
	`

	if err := r.db.SelectContext(ctx, &comments, query, postID); err != nil {
		return nil, fmt.Errorf("failed to get comments: %w", err)
	}

	return comments, nil
}

// Update обновляет комментарий
func (r *CommentPostgres) Update(ctx context.Context, id int, comment models.CommentUpdate) error {
	query := `
		UPDATE comments
		SET content = $1, updated_at = $2
		WHERE id = $3
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		comment.Content,
		time.Now(),
		id,
	)

	if err != nil {
		return fmt.Errorf("failed to update comment: %w", err)
	}

	return nil
}

// Delete удаляет комментарий
func (r *CommentPostgres) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM comments WHERE id = $1`

	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete comment: %w", err)
	}

	return nil
}
