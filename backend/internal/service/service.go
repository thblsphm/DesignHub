package service

import (
	"context"
	"designhub/internal/models"
	"designhub/internal/repository"
	"io"
	"mime/multipart"

	"github.com/jmoiron/sqlx"
)

// Authorization сервис авторизации
type Authorization interface {
	CreateUser(ctx context.Context, user models.UserSignUp) (int, error)
	GenerateToken(ctx context.Context, signIn models.UserSignIn) (string, error)
	ParseToken(token string) (int, string, error)
}

// User сервис для работы с пользователями
type User interface {
	GetByID(ctx context.Context, id int) (models.UserResponse, error)
	Update(ctx context.Context, id int, user models.UserUpdate) error
	UpdateAvatar(ctx context.Context, id int, avatar *multipart.FileHeader) error
	Delete(ctx context.Context, id int) error
}

// Post сервис для работы с постами
type Post interface {
	Create(ctx context.Context, userId int, post models.PostCreate, media *multipart.FileHeader) (int, error)
	GetByID(ctx context.Context, id int, userId int) (models.PostResponse, error)
	GetAll(ctx context.Context, userId int, filter models.PostFilter) (models.FeedResponse, error)
	GetByUserID(ctx context.Context, userId int, filter models.PostFilter) (models.FeedResponse, error)
	GetLikedByUserID(ctx context.Context, userId int, filter models.PostFilter) (models.FeedResponse, error)
	GetPendingModeration(ctx context.Context, filter models.PostFilter) (models.FeedResponse, error)
	Update(ctx context.Context, id int, userId int, post models.PostUpdate) error
	UpdateStatus(ctx context.Context, id int, moderatorId int, status models.PostModeration) error
	Delete(ctx context.Context, id int, userId int) error
}

// Comment сервис для работы с комментариями
type Comment interface {
	Create(ctx context.Context, userId int, comment models.CommentCreate) (int, error)
	GetByID(ctx context.Context, id int) (models.CommentResponse, error)
	GetByPostID(ctx context.Context, postId int) ([]models.CommentResponse, error)
	Update(ctx context.Context, id int, userId int, comment models.CommentUpdate) error
	Delete(ctx context.Context, id int, userId int) error
}

// Like сервис для работы с лайками
type Like interface {
	Create(ctx context.Context, userId int, like models.LikeCreate) (int, error)
	Delete(ctx context.Context, postId int, userId int) error
	IsLiked(ctx context.Context, postId int, userId int) (bool, error)
}

// Category сервис для работы с категориями
type Category interface {
	Create(ctx context.Context, category models.CategoryCreate) (int, error)
	GetByID(ctx context.Context, id int) (models.Category, error)
	GetAll(ctx context.Context) ([]models.Category, error)
	Update(ctx context.Context, id int, category models.CategoryUpdate) error
	Delete(ctx context.Context, id int) error
}

// Service главная структура сервисного слоя
type Service struct {
	Authorization
	User
	Post
	Comment
	Like
	Category
}

// NewService конструктор сервисного слоя
func NewService(repos *repository.Repository, db *sqlx.DB, fileStorage FileStorage) *Service {
	return &Service{
		Authorization: NewAuthService(repos.User),
		User:          NewUserService(repos.User, fileStorage),
		Post:          NewPostService(repos.Post, repos.Like, repos.User, repos.Category, fileStorage),
		Comment:       NewCommentService(repos.Comment, repos.User),
		Like:          NewLikeService(repos.Like, repos.Post),
		Category:      NewCategoryService(repos.Category),
	}
}

// FileStorage интерфейс для работы с файловым хранилищем
type FileStorage interface {
	SaveFile(file io.Reader, filename string) (string, error)
	GetFileURL(filename string) string
	DeleteFile(filename string) error
}
