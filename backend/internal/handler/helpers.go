package handler

import (
	"designhub/internal/models"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// handleError обрабатывает ошибки и возвращает соответствующий HTTP ответ
func handleError(c *gin.Context, err error) {
	// Здесь можно доработать обработку специфических ошибок, определив их типы
	var statusCode int
	var message string

	switch {
	case strings.Contains(err.Error(), "already exists") || strings.Contains(err.Error(), "уже существует"):
		statusCode = http.StatusConflict
		message = err.Error()
	case strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "не найден"):
		statusCode = http.StatusNotFound
		message = err.Error()
	case strings.Contains(err.Error(), "unauthorized") || strings.Contains(err.Error(), "не авторизован"):
		statusCode = http.StatusUnauthorized
		message = "Не авторизован"
	case strings.Contains(err.Error(), "forbidden") || strings.Contains(err.Error(), "доступ запрещен"):
		statusCode = http.StatusForbidden
		message = "Доступ запрещен"
	case strings.Contains(err.Error(), "неверный пароль"):
		statusCode = http.StatusUnauthorized
		message = "Неверный email или пароль"
	default:
		statusCode = http.StatusInternalServerError
		message = "Внутренняя ошибка сервера"
	}

	c.JSON(statusCode, models.StandardError{
		Status:  statusCode,
		Message: message,
		Detail:  err.Error(),
	})
}

// handleValidationError обрабатывает ошибки валидации
func handleValidationError(c *gin.Context, err error) {
	var ve validator.ValidationErrors
	if errors.As(err, &ve) {
		var validationErrors []models.ValidationError
		for _, e := range ve {
			validationErrors = append(validationErrors, models.ValidationError{
				Field:   e.Field(),
				Message: getValidationErrorMessage(e),
			})
		}
		c.JSON(http.StatusUnprocessableEntity, models.ValidationErrors{
			Status: http.StatusUnprocessableEntity,
			Errors: validationErrors,
		})
		return
	}

	// Если ошибка не связана с валидацией полей
	c.JSON(http.StatusBadRequest, models.StandardError{
		Status:  http.StatusBadRequest,
		Message: "Некорректный запрос",
		Detail:  err.Error(),
	})
}

// getValidationErrorMessage возвращает сообщение об ошибке валидации
func getValidationErrorMessage(e validator.FieldError) string {
	switch e.Tag() {
	case "required":
		return "Обязательное поле"
	case "min":
		return "Значение слишком маленькое"
	case "max":
		return "Значение слишком большое"
	case "email":
		return "Неверный формат email"
	case "eqfield":
		return "Поля должны совпадать"
	case "oneof":
		return "Должно быть одним из допустимых значений"
	default:
		return "Некорректное значение"
	}
}
