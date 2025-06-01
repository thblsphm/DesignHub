package service

import (
	"context"
	"designhub/internal/models"
	"designhub/internal/repository"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"time"
)

type PostService struct {
	postRepo     repository.Post
	likeRepo     repository.Like
	userRepo     repository.User
	categoryRepo repository.Category
	fileStorage  FileStorage
}

func NewPostService(
	postRepo repository.Post,
	likeRepo repository.Like,
	userRepo repository.User,
	categoryRepo repository.Category,
	fileStorage FileStorage,
) *PostService {
	return &PostService{
		postRepo:     postRepo,
		likeRepo:     likeRepo,
		userRepo:     userRepo,
		categoryRepo: categoryRepo,
		fileStorage:  fileStorage,
	}
}

// Create создает новый пост
func (s *PostService) Create(ctx context.Context, userId int, postInput models.PostCreate, mediaFile *multipart.FileHeader) (int, error) {
	// Проверяем существование пользователя
	_, err := s.userRepo.GetByID(ctx, userId)
	if err != nil {
		return 0, fmt.Errorf("user not found: %w", err)
	}

	// Проверяем существование категории
	_, err = s.categoryRepo.GetByID(ctx, postInput.CategoryID)
	if err != nil {
		return 0, fmt.Errorf("category not found: %w", err)
	}

	// Открываем файл
	file, err := mediaFile.Open()
	if err != nil {
		return 0, fmt.Errorf("failed to open media file: %w", err)
	}
	defer file.Close()

	// Генерируем уникальное имя файла
	ext := filepath.Ext(mediaFile.Filename)
	filename := fmt.Sprintf("post_%d_%d%s", userId, time.Now().UnixNano(), ext)

	// Сохраняем файл
	mediaPath, err := s.fileStorage.SaveFile(file, filename)
	if err != nil {
		return 0, fmt.Errorf("failed to save media file: %w", err)
	}

	// Определяем тип медиа (изображение или видео)
	contentType := mediaFile.Header.Get("Content-Type")
	mediaType := "image"
	if contentType == "video/mp4" || contentType == "video/webm" {
		mediaType = "video"
	}

	// Создаем пост
	post := models.Post{
		UserID:      userId,
		CategoryID:  postInput.CategoryID,
		Title:       postInput.Title,
		Description: postInput.Description,
		MediaPath:   mediaPath,
		MediaType:   mediaType,
		Status:      "pending", // Все посты сначала попадают на модерацию
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	return s.postRepo.Create(ctx, post)
}

// GetById получает детальную информацию о посте по его ID
func (s *PostService) GetByID(ctx context.Context, id int, currentUserId int) (models.PostResponse, error) {
	// Получаем информацию о посте
	post, err := s.postRepo.GetByID(ctx, id)
	if err != nil {
		return models.PostResponse{}, fmt.Errorf("post not found: %w", err)
	}

	// Если пост не опубликован, проверяем что текущий пользователь - автор или модератор
	if post.Status != "approved" {
		// Если не авторизован (currentUserId = 0), то доступ запрещен
		if currentUserId == 0 {
			return models.PostResponse{}, fmt.Errorf("доступ запрещен")
		}

		// Если не автор и не модератор, то доступ запрещен
		if post.UserID != currentUserId {
			user, err := s.userRepo.GetByID(ctx, currentUserId)
			if err != nil || (user.Role != "moderator" && user.Role != "admin") {
				return models.PostResponse{}, fmt.Errorf("доступ запрещен")
			}
		}
	}

	// Получаем информацию об авторе
	author, err := s.userRepo.GetByID(ctx, post.UserID)
	if err != nil {
		return models.PostResponse{}, fmt.Errorf("author not found: %w", err)
	}

	// Получаем категорию
	category, err := s.categoryRepo.GetByID(ctx, post.CategoryID)
	if err != nil {
		return models.PostResponse{}, fmt.Errorf("category not found: %w", err)
	}

	// Получаем количество лайков
	likesCount, err := s.likeRepo.CountByPostID(ctx, id)
	if err != nil {
		return models.PostResponse{}, fmt.Errorf("failed to get likes count: %w", err)
	}

	// Проверяем лайкнул ли текущий пользователь этот пост
	isLiked := false
	if currentUserId != 0 {
		isLiked, _ = s.likeRepo.IsLiked(ctx, id, currentUserId)
	}

	// Конвертируем в ответ
	response := models.PostResponse{
		ID:          post.ID,
		Title:       post.Title,
		Description: post.Description,
		MediaURL:    post.MediaPath,
		MediaType:   post.MediaType,
		Status:      post.Status,
		CreatedAt:   post.CreatedAt,
		UpdatedAt:   post.UpdatedAt,
		Author: models.UserBrief{
			ID:       author.ID,
			Username: author.Username,
			Nickname: author.Nickname,
			Avatar:   "", // По умолчанию пустая строка
		},
		Category: models.Category{
			ID:   category.ID,
			Name: category.Name,
			Slug: category.Slug,
		},
		IsLiked:    isLiked,
		LikesCount: likesCount,
	}

	// Если аватар автора не nil, используем его
	if author.Avatar != nil {
		response.Author.Avatar = *author.Avatar
	}

	return response, nil
}

// GetAll получает список всех постов
func (s *PostService) GetAll(ctx context.Context, currentUserId int, filter models.PostFilter) (models.FeedResponse, error) {
	// Получаем посты
	posts, total, err := s.postRepo.GetAll(ctx, filter)
	if err != nil {
		return models.FeedResponse{}, fmt.Errorf("failed to get posts: %w", err)
	}

	// Преобразуем посты в ответ
	items := make([]models.PostResponse, 0, len(posts))
	for _, post := range posts {
		// Проверяем лайкнул ли текущий пользователь этот пост
		isLiked := false
		if currentUserId != 0 {
			isLiked, _ = s.likeRepo.IsLiked(ctx, post.ID, currentUserId)
		}

		// Получаем информацию об авторе
		author, err := s.userRepo.GetByID(ctx, post.UserID)
		if err != nil {
			return models.FeedResponse{}, fmt.Errorf("author not found: %w", err)
		}

		// Получаем категорию
		category, err := s.categoryRepo.GetByID(ctx, post.CategoryID)
		if err != nil {
			return models.FeedResponse{}, fmt.Errorf("category not found: %w", err)
		}

		// Добавляем пост в ответ
		items = append(items, models.PostResponse{
			ID:          post.ID,
			Title:       post.Title,
			Description: post.Description,
			MediaURL:    post.MediaPath,
			MediaType:   post.MediaType,
			Status:      post.Status,
			CreatedAt:   post.CreatedAt,
			UpdatedAt:   post.UpdatedAt,
			Author: models.UserBrief{
				ID:       author.ID,
				Username: author.Username,
				Nickname: author.Nickname,
				Avatar:   "", // По умолчанию пустая строка
			},
			Category: models.Category{
				ID:   category.ID,
				Name: category.Name,
				Slug: category.Slug,
			},
			IsLiked:    isLiked,
			LikesCount: post.LikesCount,
		})

		// Если аватар автора не nil, используем его
		if author.Avatar != nil {
			items[len(items)-1].Author.Avatar = *author.Avatar
		}
	}

	// Формируем ответ
	response := models.FeedResponse{
		Items: items,
		Pagination: models.Pagination{
			Total:   total,
			Page:    filter.Page,
			PerPage: filter.PerPage,
			Pages:   (total + filter.PerPage - 1) / filter.PerPage,
		},
	}

	return response, nil
}

// GetByUserID получает список постов пользователя
func (s *PostService) GetByUserID(ctx context.Context, currentUserId int, filter models.PostFilter) (models.FeedResponse, error) {
	// Проверяем существование пользователя
	_, err := s.userRepo.GetByID(ctx, filter.UserID)
	if err != nil {
		return models.FeedResponse{}, fmt.Errorf("user not found: %w", err)
	}

	// Получаем посты пользователя
	posts, total, err := s.postRepo.GetByUserID(ctx, filter)
	if err != nil {
		return models.FeedResponse{}, fmt.Errorf("failed to get user posts: %w", err)
	}

	// Преобразуем посты в ответ
	items := make([]models.PostResponse, 0, len(posts))
	for _, post := range posts {
		// Если пост не опубликован, проверяем права доступа
		if post.Status != "approved" {
			// Если не текущий пользователь не автор и не модератор, пропускаем пост
			if filter.UserID != currentUserId {
				currentUser, err := s.userRepo.GetByID(ctx, currentUserId)
				if err != nil || (currentUser.Role != "moderator" && currentUser.Role != "admin") {
					continue
				}
			}
		}

		// Проверяем лайкнул ли текущий пользователь этот пост
		isLiked := false
		if currentUserId != 0 {
			isLiked, _ = s.likeRepo.IsLiked(ctx, post.ID, currentUserId)
		}

		// Получаем информацию об авторе
		author, err := s.userRepo.GetByID(ctx, post.UserID)
		if err != nil {
			return models.FeedResponse{}, fmt.Errorf("author not found: %w", err)
		}

		// Получаем категорию
		category, err := s.categoryRepo.GetByID(ctx, post.CategoryID)
		if err != nil {
			return models.FeedResponse{}, fmt.Errorf("category not found: %w", err)
		}

		// Добавляем пост в ответ
		items = append(items, models.PostResponse{
			ID:          post.ID,
			Title:       post.Title,
			Description: post.Description,
			MediaURL:    post.MediaPath,
			MediaType:   post.MediaType,
			Status:      post.Status,
			CreatedAt:   post.CreatedAt,
			UpdatedAt:   post.UpdatedAt,
			Author: models.UserBrief{
				ID:       author.ID,
				Username: author.Username,
				Nickname: author.Nickname,
				Avatar:   "", // По умолчанию пустая строка
			},
			Category: models.Category{
				ID:   category.ID,
				Name: category.Name,
				Slug: category.Slug,
			},
			IsLiked:    isLiked,
			LikesCount: post.LikesCount,
		})

		// Если аватар автора не nil, используем его
		if author.Avatar != nil {
			items[len(items)-1].Author.Avatar = *author.Avatar
		}
	}

	// Формируем ответ
	response := models.FeedResponse{
		Items: items,
		Pagination: models.Pagination{
			Total:   total,
			Page:    filter.Page,
			PerPage: filter.PerPage,
			Pages:   (total + filter.PerPage - 1) / filter.PerPage,
		},
	}

	return response, nil
}

// GetLikedByUserId получает список постов, лайкнутых пользователем
func (s *PostService) GetLikedByUserID(ctx context.Context, userId int, filter models.PostFilter) (models.FeedResponse, error) {
	// Проверяем существование пользователя
	_, err := s.userRepo.GetByID(ctx, userId)
	if err != nil {
		return models.FeedResponse{}, fmt.Errorf("user not found: %w", err)
	}

	// Получаем лайкнутые посты
	posts, total, err := s.postRepo.GetLikedByUserID(ctx, userId, filter)
	if err != nil {
		return models.FeedResponse{}, fmt.Errorf("failed to get liked posts: %w", err)
	}

	// Преобразуем посты в ответ
	items := make([]models.PostResponse, 0, len(posts))
	for _, post := range posts {
		// Получаем информацию об авторе
		author, err := s.userRepo.GetByID(ctx, post.UserID)
		if err != nil {
			return models.FeedResponse{}, fmt.Errorf("author not found: %w", err)
		}

		// Получаем категорию
		category, err := s.categoryRepo.GetByID(ctx, post.CategoryID)
		if err != nil {
			return models.FeedResponse{}, fmt.Errorf("category not found: %w", err)
		}

		// Добавляем пост в ответ
		items = append(items, models.PostResponse{
			ID:          post.ID,
			Title:       post.Title,
			Description: post.Description,
			MediaURL:    post.MediaPath,
			MediaType:   post.MediaType,
			Status:      post.Status,
			CreatedAt:   post.CreatedAt,
			UpdatedAt:   post.UpdatedAt,
			Author: models.UserBrief{
				ID:       author.ID,
				Username: author.Username,
				Nickname: author.Nickname,
				Avatar:   "", // По умолчанию пустая строка
			},
			Category: models.Category{
				ID:   category.ID,
				Name: category.Name,
				Slug: category.Slug,
			},
			IsLiked:    true, // Все посты в этом списке лайкнуты пользователем
			LikesCount: post.LikesCount,
		})

		// Если аватар автора не nil, используем его
		if author.Avatar != nil {
			items[len(items)-1].Author.Avatar = *author.Avatar
		}
	}

	// Формируем ответ
	response := models.FeedResponse{
		Items: items,
		Pagination: models.Pagination{
			Total:   total,
			Page:    filter.Page,
			PerPage: filter.PerPage,
			Pages:   (total + filter.PerPage - 1) / filter.PerPage,
		},
	}

	return response, nil
}

// GetPendingModeration получает список постов, ожидающих модерации
func (s *PostService) GetPendingModeration(ctx context.Context, filter models.PostFilter) (models.FeedResponse, error) {
	// Получаем посты со статусом "pending" напрямую из репозитория
	posts, total, err := s.postRepo.GetPendingModeration(ctx, filter)
	if err != nil {
		return models.FeedResponse{}, fmt.Errorf("failed to get pending posts: %w", err)
	}

	fmt.Printf("Найдено %d постов со статусом 'pending'\n", len(posts))

	// Преобразуем посты в ответ
	items := make([]models.PostResponse, 0, len(posts))
	for _, post := range posts {
		fmt.Printf("Пост ID: %d, Заголовок: %s, Статус: %s\n", post.ID, post.Title, post.Status)

		// Получаем информацию об авторе
		author, err := s.userRepo.GetByID(ctx, post.UserID)
		if err != nil {
			return models.FeedResponse{}, fmt.Errorf("author not found: %w", err)
		}

		// Получаем категорию
		category, err := s.categoryRepo.GetByID(ctx, post.CategoryID)
		if err != nil {
			return models.FeedResponse{}, fmt.Errorf("category not found: %w", err)
		}

		// Добавляем пост в ответ
		items = append(items, models.PostResponse{
			ID:           post.ID,
			Title:        post.Title,
			Description:  post.Description,
			MediaURL:     post.MediaPath,
			MediaType:    post.MediaType,
			Status:       post.Status,
			RejectReason: post.RejectReason,
			CreatedAt:    post.CreatedAt,
			UpdatedAt:    post.UpdatedAt,
			Author: models.UserBrief{
				ID:       author.ID,
				Username: author.Username,
				Nickname: author.Nickname,
				Avatar:   "", // По умолчанию пустая строка
			},
			Category: models.Category{
				ID:   category.ID,
				Name: category.Name,
				Slug: category.Slug,
			},
			LikesCount: post.LikesCount,
		})

		// Если аватар автора не nil, используем его
		if author.Avatar != nil {
			items[len(items)-1].Author.Avatar = *author.Avatar
		}
	}

	fmt.Printf("Формирование ответа завершено. Отправляем %d постов.\n", len(items))

	// Формируем ответ
	response := models.FeedResponse{
		Items: items,
		Pagination: models.Pagination{
			Total:   total,
			Page:    filter.Page,
			PerPage: filter.PerPage,
			Pages:   (total + filter.PerPage - 1) / filter.PerPage,
		},
	}

	return response, nil
}

// Update обновляет пост
func (s *PostService) Update(ctx context.Context, id int, userId int, postUpdate models.PostUpdate) error {
	// Получаем информацию о посте
	post, err := s.postRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("post not found: %w", err)
	}

	// Проверяем, что пользователь - автор поста или модератор
	if post.UserID != userId {
		user, err := s.userRepo.GetByID(ctx, userId)
		if err != nil || (user.Role != "moderator" && user.Role != "admin") {
			return fmt.Errorf("доступ запрещен")
		}
	}

	// Если указана категория, проверяем ее существование
	if postUpdate.CategoryID != 0 {
		_, err = s.categoryRepo.GetByID(ctx, postUpdate.CategoryID)
		if err != nil {
			return fmt.Errorf("category not found: %w", err)
		}
	}

	// Обновляем пост
	updatedPost := models.Post{
		ID:          id,
		Title:       postUpdate.Title,
		CategoryID:  postUpdate.CategoryID,
		Description: postUpdate.Description,
		UpdatedAt:   time.Now(),
	}

	return s.postRepo.Update(ctx, updatedPost)
}

// UpdateStatus обновляет статус поста (для модерации)
func (s *PostService) UpdateStatus(ctx context.Context, id int, moderatorId int, status models.PostModeration) error {
	// Получаем информацию о посте
	_, err := s.postRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("post not found: %w", err)
	}

	// Проверяем, что пользователь - модератор
	moderator, err := s.userRepo.GetByID(ctx, moderatorId)
	if err != nil || (moderator.Role != "moderator" && moderator.Role != "admin") {
		return fmt.Errorf("доступ запрещен")
	}

	// Обновляем статус поста
	return s.postRepo.UpdateStatus(ctx, id, status.Status, moderatorId, status.RejectReason)
}

// Delete удаляет пост
func (s *PostService) Delete(ctx context.Context, id int, userId int) error {
	// Получаем информацию о посте
	post, err := s.postRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("post not found: %w", err)
	}

	// Проверяем, что пользователь - автор поста или модератор
	if post.UserID != userId {
		user, err := s.userRepo.GetByID(ctx, userId)
		if err != nil || (user.Role != "moderator" && user.Role != "admin") {
			return fmt.Errorf("доступ запрещен")
		}
	}

	// Удаляем медиафайл поста
	if post.MediaPath != "" {
		filename := filepath.Base(post.MediaPath)
		if err := s.fileStorage.DeleteFile(filename); err != nil {
			// Логируем ошибку, но продолжаем выполнение
			fmt.Printf("failed to delete media file: %v\n", err)
		}
	}

	// Удаляем пост
	return s.postRepo.Delete(ctx, id)
}
