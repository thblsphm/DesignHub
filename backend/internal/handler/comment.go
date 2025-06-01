package handler

import (
	"designhub/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// @Summary Получение комментариев к посту
// @Tags comments
// @Description Получение списка комментариев к указанному посту
// @Accept json
// @Produce json
// @Param id path int true "ID поста"
// @Success 200 {array} models.CommentResponse "Список комментариев"
// @Failure 400 {object} models.StandardError "Некорректный ID поста"
// @Failure 404 {object} models.StandardError "Пост не найден"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/public/posts/{id}/comments [get]
func (h *Handler) getPostComments(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID поста"})
		return
	}

	comments, err := h.services.Comment.GetByPostID(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, comments)
}

// @Summary Создание комментария
// @Tags comments
// @Description Добавление нового комментария к посту
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "ID поста"
// @Param input body models.CommentCreate true "Данные комментария"
// @Success 201 {object} models.CommentResponse "Созданный комментарий"
// @Failure 400,422 {object} models.StandardError "Ошибка валидации данных"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 404 {object} models.StandardError "Пост не найден"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/posts/{id}/comments [post]
func (h *Handler) createComment(c *gin.Context) {
	userId, err := getUserId(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		return
	}

	postId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID поста"})
		return
	}

	var input models.CommentCreate
	if err := c.ShouldBindJSON(&input); err != nil {
		handleValidationError(c, err)
		return
	}

	// Устанавливаем ID поста из URL
	input.PostID = postId

	// Создаем комментарий
	commentId, err := h.services.Comment.Create(c.Request.Context(), userId, input)
	if err != nil {
		handleError(c, err)
		return
	}

	// Получаем созданный комментарий
	comment, err := h.services.Comment.GetByID(c.Request.Context(), commentId)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusCreated, comment)
}

// @Summary Обновление комментария
// @Tags comments
// @Description Обновление существующего комментария
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "ID комментария"
// @Param input body models.CommentUpdate true "Данные для обновления комментария"
// @Success 200 {object} models.CommentResponse "Обновленный комментарий"
// @Failure 400,422 {object} models.StandardError "Ошибка валидации данных"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 403 {object} models.StandardError "Доступ запрещен"
// @Failure 404 {object} models.StandardError "Комментарий не найден"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/posts/comments/{id} [put]
func (h *Handler) updateComment(c *gin.Context) {
	userId, err := getUserId(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		return
	}

	commentId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID комментария"})
		return
	}

	var input models.CommentUpdate
	if err := c.ShouldBindJSON(&input); err != nil {
		handleValidationError(c, err)
		return
	}

	// Обновляем комментарий
	if err := h.services.Comment.Update(c.Request.Context(), commentId, userId, input); err != nil {
		handleError(c, err)
		return
	}

	// Получаем обновленный комментарий
	comment, err := h.services.Comment.GetByID(c.Request.Context(), commentId)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, comment)
}

// @Summary Удаление комментария
// @Tags comments
// @Description Удаление комментария
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "ID комментария"
// @Success 200 {object} map[string]interface{} "Сообщение об успешном удалении"
// @Failure 400 {object} models.StandardError "Некорректный ID комментария"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 403 {object} models.StandardError "Доступ запрещен"
// @Failure 404 {object} models.StandardError "Комментарий не найден"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/posts/comments/{id} [delete]
func (h *Handler) deleteComment(c *gin.Context) {
	userId, err := getUserId(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		return
	}

	commentId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID комментария"})
		return
	}

	// Удаляем комментарий
	if err := h.services.Comment.Delete(c.Request.Context(), commentId, userId); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Комментарий успешно удален"})
}
