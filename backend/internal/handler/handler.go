package handler

import (
	"designhub/internal/config"
	"designhub/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// Handler структура обработчика HTTP запросов
type Handler struct {
	services    *service.Service
	fileStorage service.FileStorage
	config      *config.Config
}

// NewHandler конструктор обработчика HTTP запросов
func NewHandler(services *service.Service, fileStorage service.FileStorage, config *config.Config) *Handler {
	return &Handler{
		services:    services,
		fileStorage: fileStorage,
		config:      config,
	}
}

// InitRoutes инициализирует маршруты HTTP запросов
func (h *Handler) InitRoutes() *gin.Engine {
	// Настройка Gin
	router := gin.New()

	// Отключаем автоматические перенаправления для предотвращения циклов
	router.RedirectTrailingSlash = false
	router.RedirectFixedPath = false

	// Настройка CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60,
	}))

	// Настройка recovery middleware
	router.Use(gin.Recovery())

	// Обработка статических файлов для хранилища медиа
	router.Static("/media", h.config.Storage.MediaDir)

	// Настройка Swagger
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Версионирование API
	api := router.Group("/api")
	{
		v1 := api.Group("/v1")
		{
			// Регистрация и авторизация
			auth := v1.Group("/auth")
			{
				auth.POST("/sign-up", h.signUp)
				auth.POST("/sign-in", h.signIn)
			}

			// Публичные эндпоинты
			// Категории (доступны всем)
			categories := v1.Group("/categories")
			{
				categories.GET("", h.getAllCategories)
				categories.GET("/", h.getAllCategories)
				categories.GET("/:id", h.getCategoryById)
			}

			// Посты (публичный доступ)
			public := v1.Group("/public")
			{
				public.GET("/posts", h.getAllPosts)
				public.GET("/posts/:id", h.getPostById)
				public.GET("/posts/:id/comments", h.getPostComments)
				public.GET("/users/:id", h.getUserById)
				public.GET("/users/:id/posts", h.getUserPosts)
			}

			// Защищенные эндпоинты (требуют авторизации)
			protected := v1.Group("/", h.userIdentity)
			{
				// Профиль пользователя
				users := protected.Group("/users")
				{
					users.GET("/me", h.getUserProfile)
					users.PUT("/me", h.updateUserProfile)
					users.PUT("/me/avatar", h.updateUserAvatar)
					users.GET("/me/likes", h.getUserLikedPosts)
				}

				// Посты
				posts := protected.Group("/posts")
				{
					posts.POST("", h.createPost)
					posts.POST("/", h.createPost)
					posts.PUT("/:id", h.updatePost)
					posts.DELETE("/:id", h.deletePost)
					posts.POST("/:id/like", h.likePost)
					posts.DELETE("/:id/like", h.unlikePost)
					posts.POST("/:id/comments", h.createComment)
					posts.PUT("/comments/:id", h.updateComment)
					posts.DELETE("/comments/:id", h.deleteComment)
				}
			}

			// Эндпоинты для модераторов (требуют авторизации и роли модератора)
			moderator := v1.Group("/admin", h.userIdentity, h.moderatorRequired)
			{
				moderator.GET("/moderation", h.getPostsPendingModeration)
				moderator.PUT("/moderation/:id", h.moderatePost)

				// Управление категориями
				moderator.POST("/categories", h.createCategory)
				moderator.PUT("/categories/:id", h.updateCategory)
				moderator.DELETE("/categories/:id", h.deleteCategory)
			}
		}
	}

	return router
}
