package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	authorizationHeader = "Authorization"
	userCtx             = "userId"
	userRoleCtx         = "userRole"
)

// userIdentity middleware для проверки JWT токена и идентификации пользователя
func (h *Handler) userIdentity(c *gin.Context) {
	header := c.GetHeader(authorizationHeader)
	if header == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		c.Abort()
		return
	}

	headerParts := strings.Split(header, " ")
	if len(headerParts) != 2 || headerParts[0] != "Bearer" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Некорректный формат токена"})
		c.Abort()
		return
	}

	userId, userRole, err := h.services.Authorization.ParseToken(headerParts[1])
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Недействительный токен"})
		c.Abort()
		return
	}

	c.Set(userCtx, userId)
	c.Set(userRoleCtx, userRole)
	c.Next()
}

// moderatorRequired middleware для проверки роли модератора
func (h *Handler) moderatorRequired(c *gin.Context) {
	userRole, exists := c.Get(userRoleCtx)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Требуется авторизация"})
		c.Abort()
		return
	}

	if userRole != "moderator" && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"message": "Доступ запрещен. Требуются права модератора."})
		c.Abort()
		return
	}

	c.Next()
}

// getUserId получает ID пользователя из контекста
func getUserId(c *gin.Context) (int, error) {
	idFromContext, exists := c.Get(userCtx)
	if !exists {
		return 0, errors.New("пользователь не найден в контексте")
	}

	id, ok := idFromContext.(int)
	if !ok {
		return 0, errors.New("некорректный ID пользователя")
	}

	return id, nil
}

// getUserRole получает роль пользователя из контекста
func getUserRole(c *gin.Context) (string, error) {
	roleFromContext, exists := c.Get(userRoleCtx)
	if !exists {
		return "", errors.New("роль пользователя не найдена в контексте")
	}

	role, ok := roleFromContext.(string)
	if !ok {
		return "", errors.New("некорректная роль пользователя")
	}

	return role, nil
}
