package handler

import (
	"designhub/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// @Summary Получение профиля текущего пользователя
// @Tags users
// @Description Получение информации о текущем пользователе
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} models.UserResponse "Информация о пользователе"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/users/me [get]
func (h *Handler) getUserProfile(c *gin.Context) {
	userId, err := getUserId(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		return
	}

	user, err := h.services.User.GetByID(c.Request.Context(), userId)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, user)
}

// @Summary Получение профиля пользователя по ID
// @Tags users
// @Description Получение информации о пользователе по ID
// @Accept json
// @Produce json
// @Param id path int true "ID пользователя"
// @Success 200 {object} models.UserResponse "Информация о пользователе"
// @Failure 404 {object} models.StandardError "Пользователь не найден"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/public/users/{id} [get]
func (h *Handler) getUserById(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID пользователя"})
		return
	}

	user, err := h.services.User.GetByID(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, user)
}

// @Summary Обновление профиля пользователя
// @Tags users
// @Description Обновление информации о текущем пользователе
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param input body models.UserUpdate true "Данные для обновления пользователя"
// @Success 200 {object} models.UserResponse "Обновленная информация о пользователе"
// @Failure 400,422 {object} models.StandardError "Ошибка валидации данных"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/users/me [put]
func (h *Handler) updateUserProfile(c *gin.Context) {
	userId, err := getUserId(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		return
	}

	var input models.UserUpdate
	if err := c.ShouldBindJSON(&input); err != nil {
		handleValidationError(c, err)
		return
	}

	if err := h.services.User.Update(c.Request.Context(), userId, input); err != nil {
		handleError(c, err)
		return
	}

	user, err := h.services.User.GetByID(c.Request.Context(), userId)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, user)
}

// @Summary Обновление аватара пользователя
// @Tags users
// @Description Загрузка нового аватара пользователя
// @Accept multipart/form-data
// @Produce json
// @Security ApiKeyAuth
// @Param avatar formData file true "Файл аватара"
// @Success 200 {object} models.UserResponse "Обновленная информация о пользователе"
// @Failure 400 {object} models.StandardError "Ошибка валидации данных"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/users/me/avatar [put]
func (h *Handler) updateUserAvatar(c *gin.Context) {
	userId, err := getUserId(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		return
	}

	file, header, err := c.Request.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Ошибка загрузки файла"})
		return
	}
	defer file.Close()

	// Проверка типа файла
	contentType := header.Header.Get("Content-Type")
	if contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/gif" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Недопустимый формат файла. Допустимые форматы: JPEG, PNG, GIF"})
		return
	}

	// Проверка размера файла (максимум 5 МБ)
	if header.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Размер файла превышает лимит в 5 МБ"})
		return
	}

	// Обновление аватара в БД
	if err := h.services.User.UpdateAvatar(c.Request.Context(), userId, header); err != nil {
		handleError(c, err)
		return
	}

	// Получение обновленных данных пользователя
	user, err := h.services.User.GetByID(c.Request.Context(), userId)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, user)
}

// @Summary Получение постов, понравившихся пользователю
// @Tags users
// @Description Получение списка постов, которые понравились текущему пользователю
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param page query int false "Номер страницы"
// @Param per_page query int false "Количество записей на странице"
// @Success 200 {object} models.FeedResponse "Список понравившихся постов"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/users/me/likes [get]
func (h *Handler) getUserLikedPosts(c *gin.Context) {
	userId, err := getUserId(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
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

	posts, err := h.services.Post.GetLikedByUserID(c.Request.Context(), userId, filter)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, posts)
}

// @Summary Получение постов пользователя
// @Tags users
// @Description Получение списка постов указанного пользователя
// @Accept json
// @Produce json
// @Param id path int true "ID пользователя"
// @Param page query int false "Номер страницы"
// @Param per_page query int false "Количество записей на странице"
// @Success 200 {object} models.FeedResponse "Список постов пользователя"
// @Failure 404 {object} models.StandardError "Пользователь не найден"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/public/users/{id}/posts [get]
func (h *Handler) getUserPosts(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID пользователя"})
		return
	}

	var filter models.PostFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		handleValidationError(c, err)
		return
	}

	// Устанавливаем ID пользователя
	filter.UserID = id

	// Устанавливаем значения по умолчанию, если не указаны
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PerPage < 1 || filter.PerPage > 100 {
		filter.PerPage = 12
	}

	// Получаем текущего пользователя из контекста (если он авторизован)
	currentUserId, _ := getUserId(c)

	posts, err := h.services.Post.GetByUserID(c.Request.Context(), currentUserId, filter)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, posts)
}
