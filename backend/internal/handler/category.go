package handler

import (
	"designhub/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// @Summary Получение всех категорий
// @Tags categories
// @Description Получение списка всех категорий
// @Accept json
// @Produce json
// @Success 200 {array} models.CategoryResponse "Список категорий"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/categories [get]
func (h *Handler) getAllCategories(c *gin.Context) {
	categories, err := h.services.Category.GetAll(c.Request.Context())
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, categories)
}

// @Summary Получение категории по ID
// @Tags categories
// @Description Получение информации о категории по ее ID
// @Accept json
// @Produce json
// @Param id path int true "ID категории"
// @Success 200 {object} models.CategoryResponse "Информация о категории"
// @Failure 400 {object} models.StandardError "Некорректный ID категории"
// @Failure 404 {object} models.StandardError "Категория не найдена"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/categories/{id} [get]
func (h *Handler) getCategoryById(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID категории"})
		return
	}

	category, err := h.services.Category.GetByID(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, category)
}

// @Summary Создание новой категории
// @Tags categories
// @Description Создание новой категории (только для модераторов)
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param input body models.CategoryCreate true "Данные категории"
// @Success 201 {object} models.CategoryResponse "Созданная категория"
// @Failure 400,422 {object} models.StandardError "Ошибка валидации данных"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 403 {object} models.StandardError "Доступ запрещен"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/admin/categories [post]
func (h *Handler) createCategory(c *gin.Context) {
	// Проверка прав доступа выполняется в middleware, но для дополнительной безопасности проверим еще раз
	role, err := getUserRole(c)
	if err != nil || (role != "moderator" && role != "admin") {
		c.JSON(http.StatusForbidden, gin.H{"message": "Доступ запрещен. Требуются права модератора."})
		return
	}

	var input models.CategoryCreate
	if err := c.ShouldBindJSON(&input); err != nil {
		handleValidationError(c, err)
		return
	}

	// Создаем категорию
	categoryId, err := h.services.Category.Create(c.Request.Context(), input)
	if err != nil {
		handleError(c, err)
		return
	}

	// Получаем созданную категорию
	category, err := h.services.Category.GetByID(c.Request.Context(), categoryId)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusCreated, category)
}

// @Summary Обновление категории
// @Tags categories
// @Description Обновление существующей категории (только для модераторов)
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "ID категории"
// @Param input body models.CategoryUpdate true "Данные для обновления категории"
// @Success 200 {object} models.CategoryResponse "Обновленная категория"
// @Failure 400,422 {object} models.StandardError "Ошибка валидации данных"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 403 {object} models.StandardError "Доступ запрещен"
// @Failure 404 {object} models.StandardError "Категория не найдена"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/admin/categories/{id} [put]
func (h *Handler) updateCategory(c *gin.Context) {
	// Проверка прав доступа выполняется в middleware, но для дополнительной безопасности проверим еще раз
	role, err := getUserRole(c)
	if err != nil || (role != "moderator" && role != "admin") {
		c.JSON(http.StatusForbidden, gin.H{"message": "Доступ запрещен. Требуются права модератора."})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID категории"})
		return
	}

	var input models.CategoryUpdate
	if err := c.ShouldBindJSON(&input); err != nil {
		handleValidationError(c, err)
		return
	}

	// Обновляем категорию
	if err := h.services.Category.Update(c.Request.Context(), id, input); err != nil {
		handleError(c, err)
		return
	}

	// Получаем обновленную категорию
	category, err := h.services.Category.GetByID(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, category)
}

// @Summary Удаление категории
// @Tags categories
// @Description Удаление категории (только для модераторов)
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "ID категории"
// @Success 200 {object} map[string]interface{} "Сообщение об успешном удалении"
// @Failure 400 {object} models.StandardError "Некорректный ID категории"
// @Failure 401 {object} models.StandardError "Не авторизован"
// @Failure 403 {object} models.StandardError "Доступ запрещен"
// @Failure 404 {object} models.StandardError "Категория не найдена"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/admin/categories/{id} [delete]
func (h *Handler) deleteCategory(c *gin.Context) {
	// Проверка прав доступа выполняется в middleware, но для дополнительной безопасности проверим еще раз
	role, err := getUserRole(c)
	if err != nil || (role != "moderator" && role != "admin") {
		c.JSON(http.StatusForbidden, gin.H{"message": "Доступ запрещен. Требуются права модератора."})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Некорректный ID категории"})
		return
	}

	// Удаляем категорию
	if err := h.services.Category.Delete(c.Request.Context(), id); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Категория успешно удалена"})
}
