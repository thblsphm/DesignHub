package postgres

import (
	"context"
	"designhub/internal/models"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

type CategoryPostgres struct {
	db *sqlx.DB
}

func NewCategoryPostgres(db *sqlx.DB) *CategoryPostgres {
	return &CategoryPostgres{db: db}
}

// Create создает новую категорию
func (r *CategoryPostgres) Create(ctx context.Context, category models.Category) (int, error) {
	var id int

	query := `
		INSERT INTO categories 
		(name, slug, created_at, updated_at) 
		VALUES 
		($1, $2, $3, $4)
		RETURNING id
	`

	row := r.db.QueryRowContext(
		ctx,
		query,
		category.Name,
		category.Slug,
		category.CreatedAt,
		category.UpdatedAt,
	)

	if err := row.Scan(&id); err != nil {
		return 0, fmt.Errorf("failed to create category: %w", err)
	}

	return id, nil
}

// GetByID получает категорию по ID
func (r *CategoryPostgres) GetByID(ctx context.Context, id int) (models.Category, error) {
	var category models.Category

	query := `
		SELECT id, name, slug, created_at, updated_at
		FROM categories 
		WHERE id = $1
	`

	if err := r.db.GetContext(ctx, &category, query, id); err != nil {
		return models.Category{}, fmt.Errorf("category not found: %w", err)
	}

	return category, nil
}

// GetAll получает все категории
func (r *CategoryPostgres) GetAll(ctx context.Context) ([]models.Category, error) {
	var categories []models.Category

	query := `
		SELECT id, name, slug, created_at, updated_at
		FROM categories 
		ORDER BY name ASC
	`

	if err := r.db.SelectContext(ctx, &categories, query); err != nil {
		return nil, fmt.Errorf("failed to get categories: %w", err)
	}

	return categories, nil
}

// SlugExists проверяет существование категории с указанным slug
func (r *CategoryPostgres) SlugExists(ctx context.Context, slug string) (bool, error) {
	var count int

	query := `
		SELECT COUNT(*) 
		FROM categories 
		WHERE slug = $1
	`

	if err := r.db.GetContext(ctx, &count, query, slug); err != nil {
		return false, fmt.Errorf("failed to check slug existence: %w", err)
	}

	return count > 0, nil
}

// SlugExistsExcept проверяет существование категории с указанным slug, исключая категорию с указанным ID
func (r *CategoryPostgres) SlugExistsExcept(ctx context.Context, slug string, id int) (bool, error) {
	var count int

	query := `
		SELECT COUNT(*) 
		FROM categories 
		WHERE slug = $1 AND id != $2
	`

	if err := r.db.GetContext(ctx, &count, query, slug, id); err != nil {
		return false, fmt.Errorf("failed to check slug existence: %w", err)
	}

	return count > 0, nil
}

// HasRelatedPosts проверяет, используется ли категория в постах
func (r *CategoryPostgres) HasRelatedPosts(ctx context.Context, id int) (bool, error) {
	var count int

	query := `
		SELECT COUNT(*) 
		FROM posts 
		WHERE category_id = $1
	`

	if err := r.db.GetContext(ctx, &count, query, id); err != nil {
		return false, fmt.Errorf("failed to check related posts: %w", err)
	}

	return count > 0, nil
}

// Update обновляет категорию
func (r *CategoryPostgres) Update(ctx context.Context, category models.Category) error {
	query := `
		UPDATE categories
		SET name = COALESCE(NULLIF($1, ''), name),
			slug = COALESCE(NULLIF($2, ''), slug),
			updated_at = $3
		WHERE id = $4
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		category.Name,
		category.Slug,
		time.Now(),
		category.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update category: %w", err)
	}

	return nil
}

// Delete удаляет категорию
func (r *CategoryPostgres) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM categories WHERE id = $1`

	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}

	return nil
}
