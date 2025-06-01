package postgres

import (
	"context"
	"designhub/internal/models"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// UserPostgres репозиторий для работы с пользователями в PostgreSQL
type UserPostgres struct {
	db *sqlx.DB
}

// NewUserPostgres создает новый экземпляр UserPostgres
func NewUserPostgres(db *sqlx.DB) *UserPostgres {
	return &UserPostgres{db: db}
}

// Create создает нового пользователя в базе данных
func (r *UserPostgres) Create(ctx context.Context, user models.User) (int, error) {
	var id int
	query := `
		INSERT INTO users 
		    (username, nickname, email, password_hash, role, created_at, updated_at) 
		VALUES 
		    ($1, $2, $3, $4, $5, NOW(), NOW()) 
		RETURNING id
	`

	row := r.db.QueryRowContext(
		ctx,
		query,
		user.Username,
		user.Nickname,
		user.Email,
		user.Password,
		user.Role,
	)

	if err := row.Scan(&id); err != nil {
		return 0, fmt.Errorf("UserPostgres.Create: %w", err)
	}

	return id, nil
}

// GetByID получает пользователя по ID
func (r *UserPostgres) GetByID(ctx context.Context, id int) (models.User, error) {
	var user models.User
	query := `
		SELECT * FROM users WHERE id = $1
	`

	err := r.db.GetContext(ctx, &user, query, id)
	if err != nil {
		return models.User{}, fmt.Errorf("UserPostgres.GetByID: %w", err)
	}

	return user, nil
}

// GetByEmail получает пользователя по email
func (r *UserPostgres) GetByEmail(ctx context.Context, email string) (models.User, error) {
	var user models.User
	query := `
		SELECT * FROM users WHERE email = $1
	`

	err := r.db.GetContext(ctx, &user, query, email)
	if err != nil {
		return models.User{}, fmt.Errorf("UserPostgres.GetByEmail: %w", err)
	}

	return user, nil
}

// Update обновляет информацию о пользователе
func (r *UserPostgres) Update(ctx context.Context, id int, update models.UserUpdate) error {
	query := `
		UPDATE users 
		SET 
			username = COALESCE(NULLIF($1, ''), username),
			nickname = COALESCE(NULLIF($2, ''), nickname),
			description = COALESCE(NULLIF($3, ''), description),
			vk_link = COALESCE(NULLIF($4, ''), vk_link),
			telegram_link = COALESCE(NULLIF($5, ''), telegram_link),
			updated_at = NOW()
		WHERE id = $6
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		update.Username,
		update.Nickname,
		update.Description,
		update.VkLink,
		update.TelegramLink,
		id,
	)

	if err != nil {
		return fmt.Errorf("UserPostgres.Update: %w", err)
	}

	return nil
}

// UpdateAvatar обновляет аватар пользователя
func (r *UserPostgres) UpdateAvatar(ctx context.Context, id int, avatarPath string) error {
	query := `
		UPDATE users 
		SET 
			avatar = $1,
			updated_at = NOW()
		WHERE id = $2
	`

	_, err := r.db.ExecContext(ctx, query, avatarPath, id)
	if err != nil {
		return fmt.Errorf("UserPostgres.UpdateAvatar: %w", err)
	}

	return nil
}

// Delete удаляет пользователя по ID
func (r *UserPostgres) Delete(ctx context.Context, id int) error {
	query := `
		DELETE FROM users WHERE id = $1
	`

	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("UserPostgres.Delete: %w", err)
	}

	return nil
}
