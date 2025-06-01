package postgres

import (
	"context"
	"designhub/internal/models"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

type PostPostgres struct {
	db *sqlx.DB
}

func NewPostPostgres(db *sqlx.DB) *PostPostgres {
	return &PostPostgres{db: db}
}

// Create создает новый пост
func (r *PostPostgres) Create(ctx context.Context, post models.Post) (int, error) {
	var id int

	query := `
		INSERT INTO posts 
		(user_id, category_id, title, description, media_path, media_type, status, reject_reason, created_at, updated_at) 
		VALUES 
		($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`

	row := r.db.QueryRowContext(
		ctx,
		query,
		post.UserID,
		post.CategoryID,
		post.Title,
		post.Description,
		post.MediaPath,
		post.MediaType,
		post.Status,
		post.RejectReason,
		post.CreatedAt,
		post.UpdatedAt,
	)

	if err := row.Scan(&id); err != nil {
		return 0, fmt.Errorf("failed to create post: %w", err)
	}

	return id, nil
}

// GetByID получает пост по ID
func (r *PostPostgres) GetByID(ctx context.Context, id int) (models.Post, error) {
	var post models.Post

	query := `
		SELECT id, user_id, category_id, title, description, media_path, media_type, status, reject_reason,
			   created_at, updated_at, (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) as likes_count 
		FROM posts 
		WHERE id = $1
	`

	if err := r.db.GetContext(ctx, &post, query, id); err != nil {
		return models.Post{}, fmt.Errorf("post not found: %w", err)
	}

	return post, nil
}

// GetAll получает все посты с фильтрацией и пагинацией
func (r *PostPostgres) GetAll(ctx context.Context, filter models.PostFilter) ([]models.Post, int, error) {
	var posts []models.Post
	var total int

	// Базовый запрос
	query := `
		SELECT id, user_id, category_id, title, description, media_path, media_type, status, reject_reason,
			created_at, updated_at, (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) as likes_count 
		FROM posts
		WHERE 1=1
	`

	// Запрос для подсчета общего количества
	countQuery := "SELECT COUNT(*) FROM posts WHERE 1=1"

	// Параметры
	var params []interface{}
	var paramIndex int = 1

	// Добавляем фильтры
	if filter.CategoryID != 0 {
		query += fmt.Sprintf(" AND category_id = $%d", paramIndex)
		countQuery += fmt.Sprintf(" AND category_id = $%d", paramIndex)
		params = append(params, filter.CategoryID)
		paramIndex++
	}

	if filter.UserID != 0 {
		query += fmt.Sprintf(" AND user_id = $%d", paramIndex)
		countQuery += fmt.Sprintf(" AND user_id = $%d", paramIndex)
		params = append(params, filter.UserID)
		paramIndex++
	}

	// В PostFilter больше нет Status, поэтому добавляем по умолчанию approved
	query += fmt.Sprintf(" AND status = $%d", paramIndex)
	countQuery += fmt.Sprintf(" AND status = $%d", paramIndex)
	params = append(params, "approved")
	paramIndex++

	if filter.SearchQuery != "" {
		query += fmt.Sprintf(" AND (title ILIKE $%d OR description ILIKE $%d)", paramIndex, paramIndex)
		countQuery += fmt.Sprintf(" AND (title ILIKE $%d OR description ILIKE $%d)", paramIndex, paramIndex)
		params = append(params, "%"+filter.SearchQuery+"%")
		paramIndex++
	}

	// Сортировка
	query += " ORDER BY "
	switch filter.SortBy {
	case "popularity":
		query += "likes_count"
	case "date":
		fallthrough
	default:
		query += "created_at"
	}

	// Направление сортировки
	if strings.ToLower(filter.SortOrder) == "asc" {
		query += " ASC"
	} else {
		query += " DESC"
	}

	// Пагинация
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", paramIndex, paramIndex+1)
	params = append(params, filter.PerPage, (filter.Page-1)*filter.PerPage)

	// Выполняем запрос для подсчета общего количества
	if err := r.db.GetContext(ctx, &total, countQuery, params[:paramIndex-1]...); err != nil {
		return nil, 0, fmt.Errorf("failed to count posts: %w", err)
	}

	// Выполняем запрос для получения постов
	if err := r.db.SelectContext(ctx, &posts, query, params...); err != nil {
		return nil, 0, fmt.Errorf("failed to get posts: %w", err)
	}

	return posts, total, nil
}

// GetByUserID получает посты пользователя
func (r *PostPostgres) GetByUserID(ctx context.Context, filter models.PostFilter) ([]models.Post, int, error) {
	// Устанавливаем ID пользователя в фильтр
	// Используем метод GetAll с обновленным фильтром
	return r.GetAll(ctx, filter)
}

// GetLikedByUserID получает посты, лайкнутые пользователем
func (r *PostPostgres) GetLikedByUserID(ctx context.Context, userID int, filter models.PostFilter) ([]models.Post, int, error) {
	var posts []models.Post
	var total int

	// Базовый запрос
	query := `
		SELECT p.id, p.user_id, p.category_id, p.title, p.description, p.media_path, p.media_type, p.status, p.reject_reason,
			p.created_at, p.updated_at, (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count 
		FROM posts p
		JOIN likes l ON p.id = l.post_id
		WHERE l.user_id = $1 AND p.status = 'approved'
	`

	// Запрос для подсчета общего количества
	countQuery := `
		SELECT COUNT(*) 
		FROM posts p
		JOIN likes l ON p.id = l.post_id
		WHERE l.user_id = $1 AND p.status = 'approved'
	`

	// Параметры
	var params []interface{}
	params = append(params, userID)
	paramIndex := 2

	// Добавляем фильтры
	if filter.CategoryID != 0 {
		query += fmt.Sprintf(" AND p.category_id = $%d", paramIndex)
		countQuery += fmt.Sprintf(" AND p.category_id = $%d", paramIndex)
		params = append(params, filter.CategoryID)
		paramIndex++
	}

	if filter.SearchQuery != "" {
		query += fmt.Sprintf(" AND (p.title ILIKE $%d OR p.description ILIKE $%d)", paramIndex, paramIndex)
		countQuery += fmt.Sprintf(" AND (p.title ILIKE $%d OR p.description ILIKE $%d)", paramIndex, paramIndex)
		params = append(params, "%"+filter.SearchQuery+"%")
		paramIndex++
	}

	// Сортировка
	query += " ORDER BY "
	switch filter.SortBy {
	case "popularity":
		query += "likes_count"
	case "date":
		fallthrough
	default:
		query += "p.created_at"
	}

	// Направление сортировки
	if strings.ToLower(filter.SortOrder) == "asc" {
		query += " ASC"
	} else {
		query += " DESC"
	}

	// Пагинация
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", paramIndex, paramIndex+1)
	params = append(params, filter.PerPage, (filter.Page-1)*filter.PerPage)

	// Выполняем запрос для подсчета общего количества
	if err := r.db.GetContext(ctx, &total, countQuery, params[:paramIndex-1]...); err != nil {
		return nil, 0, fmt.Errorf("failed to count liked posts: %w", err)
	}

	// Выполняем запрос для получения постов
	if err := r.db.SelectContext(ctx, &posts, query, params...); err != nil {
		return nil, 0, fmt.Errorf("failed to get liked posts: %w", err)
	}

	return posts, total, nil
}

// GetPendingModeration получает посты, ожидающие модерации
func (r *PostPostgres) GetPendingModeration(ctx context.Context, filter models.PostFilter) ([]models.Post, int, error) {
	// Устанавливаем статус в 'pending' и используем GetAll
	// В новой модели PostFilter нет поля Status, поэтому мы должны изменить запрос

	var posts []models.Post
	var total int

	// Базовый запрос
	query := `
		SELECT id, user_id, category_id, title, description, media_path, media_type, status, reject_reason,
			created_at, updated_at, (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) as likes_count 
		FROM posts
		WHERE status = 'pending'
	`

	// Запрос для подсчета общего количества
	countQuery := "SELECT COUNT(*) FROM posts WHERE status = 'pending'"

	// Параметры
	var params []interface{}
	var paramIndex int = 1

	// Добавляем фильтры
	if filter.CategoryID != 0 {
		query += fmt.Sprintf(" AND category_id = $%d", paramIndex)
		countQuery += fmt.Sprintf(" AND category_id = $%d", paramIndex)
		params = append(params, filter.CategoryID)
		paramIndex++
	}

	if filter.UserID != 0 {
		query += fmt.Sprintf(" AND user_id = $%d", paramIndex)
		countQuery += fmt.Sprintf(" AND user_id = $%d", paramIndex)
		params = append(params, filter.UserID)
		paramIndex++
	}

	if filter.SearchQuery != "" {
		query += fmt.Sprintf(" AND (title ILIKE $%d OR description ILIKE $%d)", paramIndex, paramIndex)
		countQuery += fmt.Sprintf(" AND (title ILIKE $%d OR description ILIKE $%d)", paramIndex, paramIndex)
		params = append(params, "%"+filter.SearchQuery+"%")
		paramIndex++
	}

	// Сортировка
	query += " ORDER BY created_at DESC"

	// Пагинация
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", paramIndex, paramIndex+1)
	params = append(params, filter.PerPage, (filter.Page-1)*filter.PerPage)

	fmt.Printf("GetPendingModeration SQL: %s\n", query)
	fmt.Printf("GetPendingModeration Params: %v\n", params)

	// Выполняем запрос для подсчета общего количества
	if err := r.db.GetContext(ctx, &total, countQuery, params[:paramIndex-1]...); err != nil {
		return nil, 0, fmt.Errorf("failed to count pending posts: %w", err)
	}

	fmt.Printf("GetPendingModeration Total: %d\n", total)

	// Выполняем запрос для получения постов
	if err := r.db.SelectContext(ctx, &posts, query, params...); err != nil {
		return nil, 0, fmt.Errorf("failed to get pending posts: %w", err)
	}

	fmt.Printf("GetPendingModeration Retrieved posts: %d\n", len(posts))
	for i, post := range posts {
		fmt.Printf("Post %d: ID=%d, Title=%s, Status=%s\n", i+1, post.ID, post.Title, post.Status)
	}

	return posts, total, nil
}

// Update обновляет пост
func (r *PostPostgres) Update(ctx context.Context, post models.Post) error {
	query := `
		UPDATE posts
		SET title = COALESCE(NULLIF($1, ''), title),
			description = COALESCE(NULLIF($2, ''), description),
			category_id = COALESCE(NULLIF($3, 0), category_id),
			updated_at = $4
		WHERE id = $5
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		post.Title,
		post.Description,
		post.CategoryID,
		post.UpdatedAt,
		post.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update post: %w", err)
	}

	return nil
}

// UpdateStatus обновляет статус поста
func (r *PostPostgres) UpdateStatus(ctx context.Context, id int, status string, moderatorId int, rejectReason string) error {
	var query string
	var args []interface{}

	if status == "rejected" && rejectReason != "" {
		// Если статус "rejected", сохраняем причину отклонения
		query = `
			UPDATE posts
			SET status = $1,
				reject_reason = $2,
				updated_at = $3
			WHERE id = $4
		`
		args = []interface{}{status, rejectReason, time.Now(), id}
	} else {
		// Если статус "approved" или причина отклонения пуста
		query = `
			UPDATE posts
			SET status = $1,
				reject_reason = NULL,
				updated_at = $2
			WHERE id = $3
		`
		args = []interface{}{status, time.Now(), id}
	}

	_, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update post status: %w", err)
	}

	return nil
}

// Delete удаляет пост
func (r *PostPostgres) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM posts WHERE id = $1`

	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete post: %w", err)
	}

	return nil
}
