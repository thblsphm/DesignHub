package handler

import (
	"designhub/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// @Summary Регистрация пользователя
// @Tags auth
// @Description Создание нового пользователя
// @Accept json
// @Produce json
// @Param input body models.UserSignUp true "Данные для регистрации пользователя"
// @Success 201 {object} map[string]interface{} "Информация о созданном пользователе"
// @Failure 400,422 {object} models.StandardError "Ошибка валидации данных"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/auth/sign-up [post]
func (h *Handler) signUp(c *gin.Context) {
	var input models.UserSignUp

	if err := c.ShouldBindJSON(&input); err != nil {
		handleValidationError(c, err)
		return
	}

	id, err := h.services.Authorization.CreateUser(c.Request.Context(), input)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":      id,
		"message": "Пользователь успешно зарегистрирован",
	})
}

// @Summary Авторизация пользователя
// @Tags auth
// @Description Вход пользователя в систему
// @Accept json
// @Produce json
// @Param input body models.UserSignIn true "Данные для авторизации пользователя"
// @Success 200 {object} map[string]interface{} "JWT токен для авторизации"
// @Failure 400,422 {object} models.StandardError "Ошибка валидации данных"
// @Failure 401 {object} models.StandardError "Неверные учетные данные"
// @Failure 500 {object} models.StandardError "Внутренняя ошибка сервера"
// @Router /api/v1/auth/sign-in [post]
func (h *Handler) signIn(c *gin.Context) {
	var input models.UserSignIn

	if err := c.ShouldBindJSON(&input); err != nil {
		handleValidationError(c, err)
		return
	}

	token, err := h.services.Authorization.GenerateToken(c.Request.Context(), input)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
	})
}
