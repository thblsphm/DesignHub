package models

import "time"

// User представляет модель пользователя
type User struct {
	ID           int       `json:"id" db:"id"`
	Username     string    `json:"username" db:"username"`
	Nickname     string    `json:"nickname" db:"nickname"`
	Email        string    `json:"email" db:"email"`
	Password     string    `json:"-" db:"password_hash"`
	Avatar       *string   `json:"avatar" db:"avatar"`
	Description  *string   `json:"description" db:"description"`
	VkLink       *string   `json:"vk_link" db:"vk_link"`
	TelegramLink *string   `json:"telegram_link" db:"telegram_link"`
	Role         string    `json:"role" db:"role"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// UserSignUp модель для регистрации пользователя
type UserSignUp struct {
	Username        string `json:"username" binding:"required,min=3,max=50"`
	Nickname        string `json:"nickname" binding:"required,min=3,max=50"`
	Email           string `json:"email" binding:"required,email"`
	Password        string `json:"password" binding:"required,min=6,max=64"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=Password"`
}

// UserSignIn модель для авторизации пользователя
type UserSignIn struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6,max=64"`
}

// UserUpdate модель для обновления информации о пользователе
type UserUpdate struct {
	Username     string `json:"username"`
	Nickname     string `json:"nickname"`
	Description  string `json:"description"`
	VkLink       string `json:"vk_link"`
	TelegramLink string `json:"telegram_link"`
}

// UserResponse модель ответа с информацией о пользователе
type UserResponse struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	Nickname     string    `json:"nickname"`
	Email        string    `json:"email"`
	Avatar       string    `json:"avatar"`
	Description  string    `json:"description"`
	VkLink       string    `json:"vk_link"`
	TelegramLink string    `json:"telegram_link"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}
