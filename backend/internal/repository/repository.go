package repository

import (
	"context"
	"designhub/internal/models"
	"designhub/internal/repository/postgres"

	"github.com/jmoiron/sqlx"
)

// User интерфейс репозитория для работы с пользователями
type User interface {
	Create(ctx context.Context, user models.User) (int, error)
	GetByID(ctx context.Context, id int) (models.User, error)
	GetByEmail(ctx context.Context, email string) (models.User, error)
	Update(ctx context.Context, id int, user models.UserUpdate) error
	UpdateAvatar(ctx context.Context, id int, avatarPath string) error
	Delete(ctx context.Context, id int) error
}

// Post интерфейс репозитория для работы с постами
type Post interface {
	Create(ctx context.Context, post models.Post) (int, error)
	GetByID(ctx context.Context, id int) (models.Post, error)
	GetAll(ctx context.Context, filter models.PostFilter) ([]models.Post, int, error)
	GetByUserID(ctx context.Context, filter models.PostFilter) ([]models.Post, int, error)
	GetLikedByUserID(ctx context.Context, userID int, filter models.PostFilter) ([]models.Post, int, error)
	GetPendingModeration(ctx context.Context, filter models.PostFilter) ([]models.Post, int, error)
	Update(ctx context.Context, post models.Post) error
	UpdateStatus(ctx context.Context, id int, status string, moderatorId int, rejectReason string) error
	Delete(ctx context.Context, id int) error
}

// Comment интерфейс репозитория для работы с комментариями
type Comment interface {
	Create(ctx context.Context, comment models.Comment) (int, error)
	GetByID(ctx context.Context, id int) (models.Comment, error)
	GetByPostID(ctx context.Context, postID int) ([]models.Comment, error)
	Update(ctx context.Context, id int, comment models.CommentUpdate) error
	Delete(ctx context.Context, id int) error
}

// Like интерфейс репозитория для работы с лайками
type Like interface {
	Create(ctx context.Context, like models.Like) (int, error)
	GetByID(ctx context.Context, id int) (models.Like, error)
	GetByPostIDAndUserID(ctx context.Context, postID, userID int) (models.Like, error)
	IsLiked(ctx context.Context, postID, userID int) (bool, error)
	CountByPostID(ctx context.Context, postID int) (int, error)
	Delete(ctx context.Context, id int) error
	DeleteByPostIDAndUserID(ctx context.Context, postID, userID int) error
}

// Category интерфейс репозитория для работы с категориями
type Category interface {
	Create(ctx context.Context, category models.Category) (int, error)
	GetByID(ctx context.Context, id int) (models.Category, error)
	GetAll(ctx context.Context) ([]models.Category, error)
	SlugExists(ctx context.Context, slug string) (bool, error)
	SlugExistsExcept(ctx context.Context, slug string, id int) (bool, error)
	HasRelatedPosts(ctx context.Context, id int) (bool, error)
	Update(ctx context.Context, category models.Category) error
	Delete(ctx context.Context, id int) error
}

// Repository главный интерфейс репозитория
type Repository struct {
	User     User
	Post     Post
	Comment  Comment
	Like     Like
	Category Category
}

// NewRepository создает новый экземпляр репозитория
func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{
		User:     postgres.NewUserPostgres(db),
		Post:     postgres.NewPostPostgres(db),
		Comment:  postgres.NewCommentPostgres(db),
		Like:     postgres.NewLikePostgres(db),
		Category: postgres.NewCategoryPostgres(db),
	}
}
