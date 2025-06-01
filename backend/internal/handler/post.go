package handler

import (
	"designhub/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// @Summary Получение всех постов
// @Tags posts
// @Description Получение списка постов с возможностью фильтрации и пагинации
// @Accept json
// @Produce json
// @Param category_id query int false "ID категории"
// @Param q query string false "Поисковый запрос"
// @Param sort_by query string false "Поле сортировки (date, popularity)"
// @Param sort_order query string false "Порядок сортировки (asc, desc)"
// @Param page query int false "Номер страницы"
// @Param per_page query int false "Количество записей на странице"
// @Success 200 {object} models.FeedResponse "Список постов"
// @Failure 400,422 {object} models.StandardError "Ошибка валидации данных"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/public/posts [get]
func (h *Handler) getAllPosts(c *gin.Context) {
	var filter models.PostFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		handleValidationError(c, err)
		return
	}

	// Устанавливаем значения по умолчанию, если не указаны
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PerPage < 1 || filter.PerPage > 100 {
		filter.PerPage = 12
	}
	if filter.SortBy == "" {
		filter.SortBy = "date"
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "desc"
	}

	// Получаем текущего пользователя из контекста (если он авторизован)
	currentUserId, _ := getUserId(c)

	posts, err := h.services.Post.GetAll(c.Request.Context(), currentUserId, filter)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, posts)
}

// @Summary Получение поста по ID
// @Tags posts
// @Description Получение детальной информации о посте по его ID
// @Accept json
// @Produce json
// @Param id path int true "ID поста"
// @Success 200 {object} models.PostResponse "Информация о посте"
// @Failure 400 {object} models.StandardError "Некорректный ID поста"
// @Failure 404 {object} models.StandardError "Пост не найден"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/public/posts/{id} [get]
func (h *Handler) getPostById(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID поста"})
		return
	}

	// Получаем текущего пользователя из контекста (если он авторизован)
	currentUserId, _ := getUserId(c)

	post, err := h.services.Post.GetByID(c.Request.Context(), id, currentUserId)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, post)
}

// @Summary Создание нового поста
// @Tags posts
// @Description Создание нового поста с загрузкой медиафайла
// @Accept multipart/form-data
// @Produce json
// @Security ApiKeyAuth
// @Param title formData string true "Заголовок поста"
// @Param description formData string true "Описание поста"
// @Param category_id formData int true "ID категории"
// @Param media formData file true "Медиафайл (изображение или видео)"
// @Success 201 {object} models.PostResponse "Созданный пост"
// @Failure 400,422 {object} models.StandardError "Ошибка валидации данных"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/posts [post]
func (h *Handler) createPost(c *gin.Context) {
	userId, err := getUserId(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		return
	}

	// Парсим форму с данными
	if err := c.Request.ParseMultipartForm(h.config.Storage.MaxSize); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Ошибка при обработке формы"})
		return
	}

	// Получаем параметры поста
	title := c.PostForm("title")
	description := c.PostForm("description")
	categoryIdStr := c.PostForm("category_id")

	if title == "" || description == "" || categoryIdStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Все поля обязательны к заполнению"})
		return
	}

	categoryId, err := strconv.Atoi(categoryIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID категории"})
		return
	}

	// Получаем медиафайл
	file, header, err := c.Request.FormFile("media")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Медиафайл обязателен"})
		return
	}
	defer file.Close()

	// Проверка типа файла
	contentType := header.Header.Get("Content-Type")
	isImage := contentType == "image/jpeg" || contentType == "image/png" || contentType == "image/gif"
	isVideo := contentType == "video/mp4" || contentType == "video/webm"

	if !isImage && !isVideo {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Недопустимый формат файла. Допустимые форматы: JPEG, PNG, GIF, MP4, WEBM",
		})
		return
	}

	// Создаем пост
	postInput := models.PostCreate{
		Title:       title,
		Description: description,
		CategoryID:  categoryId,
	}

	// Сохраняем пост и медиафайл
	postId, err := h.services.Post.Create(c.Request.Context(), userId, postInput, header)
	if err != nil {
		handleError(c, err)
		return
	}

	// Получаем созданный пост
	post, err := h.services.Post.GetByID(c.Request.Context(), postId, userId)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusCreated, post)
}

// @Summary Обновление поста
// @Tags posts
// @Description Обновление информации о посте
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "ID поста"
// @Param input body models.PostUpdate true "Данные для обновления поста"
// @Success 200 {object} models.PostResponse "Обновленный пост"
// @Failure 400,422 {object} models.StandardError "Ошибка валидации данных"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 403 {object} models.StandardError "Доступ запрещен"
// @Failure 404 {object} models.StandardError "Пост не найден"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/posts/{id} [put]
func (h *Handler) updatePost(c *gin.Context) {
	userId, err := getUserId(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID поста"})
		return
	}

	var input models.PostUpdate
	if err := c.ShouldBindJSON(&input); err != nil {
		handleValidationError(c, err)
		return
	}

	// Обновляем пост
	if err := h.services.Post.Update(c.Request.Context(), id, userId, input); err != nil {
		handleError(c, err)
		return
	}

	// Получаем обновленный пост
	post, err := h.services.Post.GetByID(c.Request.Context(), id, userId)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, post)
}

// @Summary Удаление поста
// @Tags posts
// @Description Удаление поста
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "ID поста"
// @Success 200 {object} map[string]interface{} "Сообщение об успешном удалении"
// @Failure 400 {object} models.StandardError "Некорректный ID поста"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 403 {object} models.StandardError "Доступ запрещен"
// @Failure 404 {object} models.StandardError "Пост не найден"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/posts/{id} [delete]
func (h *Handler) deletePost(c *gin.Context) {
	userId, err := getUserId(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID поста"})
		return
	}

	// Удаляем пост
	if err := h.services.Post.Delete(c.Request.Context(), id, userId); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Пост успешно удален"})
}

// @Summary Лайк поста
// @Tags posts
// @Description Добавление лайка к посту
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "ID поста"
// @Success 201 {object} map[string]interface{} "Сообщение об успешном добавлении лайка"
// @Failure 400 {object} models.StandardError "Некорректный ID поста"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 409 {object} models.StandardError "Лайк уже существует"
// @Failure 404 {object} models.StandardError "Пост не найден"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/posts/{id}/like [post]
func (h *Handler) likePost(c *gin.Context) {
	userId, err := getUserId(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID поста"})
		return
	}

	// Добавляем лайк
	likeInput := models.LikeCreate{
		PostID: id,
	}

	_, err = h.services.Like.Create(c.Request.Context(), userId, likeInput)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Лайк успешно добавлен"})
}

// @Summary Удаление лайка
// @Tags posts
// @Description Удаление лайка с поста
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "ID поста"
// @Success 200 {object} map[string]interface{} "Сообщение об успешном удалении лайка"
// @Failure 400 {object} models.StandardError "Некорректный ID поста"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 404 {object} models.StandardError "Лайк не найден"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/posts/{id}/like [delete]
func (h *Handler) unlikePost(c *gin.Context) {
	userId, err := getUserId(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID поста"})
		return
	}

	// Удаляем лайк
	if err := h.services.Like.Delete(c.Request.Context(), id, userId); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Лайк успешно удален"})
}

// @Summary Получение постов, ожидающих модерации
// @Tags moderation
// @Description Получение списка постов со статусом "pending"
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param page query int false "Номер страницы"
// @Param per_page query int false "Количество записей на странице"
// @Success 200 {object} models.FeedResponse "Список постов на модерации"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 403 {object} models.StandardError "Доступ запрещен"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/admin/moderation [get]
func (h *Handler) getPostsPendingModeration(c *gin.Context) {
	_, err := getUserId(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		return
	}

	// Проверка роли выполняется в middleware, но для дополнительной безопасности проверим еще раз
	role, err := getUserRole(c)
	if err != nil || (role != "moderator" && role != "admin") {
		c.JSON(http.StatusForbidden, gin.H{"message": "Доступ запрещен. Требуются права модератора."})
		return
	}

	var filter models.PostFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		handleValidationError(c, err)
		return
	}

	// Устанавливаем значения по умолчанию, если не указаны
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PerPage < 1 || filter.PerPage > 100 {
		filter.PerPage = 12
	}

	posts, err := h.services.Post.GetPendingModeration(c.Request.Context(), filter)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, posts)
}

// @Summary Модерация поста
// @Tags moderation
// @Description Изменение статуса поста на "approved" или "rejected"
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "ID поста"
// @Param input body models.PostModeration true "Данные для модерации поста"
// @Success 200 {object} models.PostResponse "Обновленный пост"
// @Failure 400,422 {object} models.StandardError "Ошибка валидации данных"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 403 {object} models.StandardError "Доступ запрещен"
// @Failure 404 {object} models.StandardError "Пост не найден"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/admin/moderation/{id} [put]
func (h *Handler) moderatePost(c *gin.Context) {
	moderatorId, err := getUserId(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		return
	}

	// Проверка роли выполняется в middleware, но для дополнительной безопасности проверим еще раз
	role, err := getUserRole(c)
	if err != nil || (role != "moderator" && role != "admin") {
		c.JSON(http.StatusForbidden, gin.H{"message": "Доступ запрещен. Требуются права модератора."})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID поста"})
		return
	}

	var input models.PostModeration
	if err := c.ShouldBindJSON(&input); err != nil {
		handleValidationError(c, err)
		return
	}

	// Обновляем статус поста
	if err := h.services.Post.UpdateStatus(c.Request.Context(), id, moderatorId, input); err != nil {
		handleError(c, err)
		return
	}

	// Получаем обновленный пост
	post, err := h.services.Post.GetByID(c.Request.Context(), id, moderatorId)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, post)
}
