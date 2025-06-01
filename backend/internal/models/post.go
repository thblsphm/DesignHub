package models

import "time"

// Post представляет модель поста
type Post struct {
	ID           int       `json:"id" db:"id"`
	Title        string    `json:"title" db:"title"`
	Description  string    `json:"description" db:"description"`
	MediaType    string    `json:"media_type" db:"media_type"` // "image" или "video"
	MediaPath    string    `json:"media_path" db:"media_path"`
	UserID       int       `json:"user_id" db:"user_id"`
	CategoryID   int       `json:"category_id" db:"category_id"`
	Status       string    `json:"status" db:"status"` // "pending", "approved", "rejected"
	RejectReason *string   `json:"reject_reason,omitempty" db:"reject_reason"`
	LikesCount   int       `json:"likes_count" db:"likes_count"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// PostCreate модель для создания поста
type PostCreate struct {
	Title       string `json:"title" binding:"required,min=3,max=100"`
	Description string `json:"description" binding:"required,min=3,max=5000"`
	CategoryID  int    `json:"category_id" binding:"required"`
	// Media будет обрабатываться отдельно через multipart/form-data
}

// PostUpdate модель для обновления поста
type PostUpdate struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	CategoryID  int    `json:"category_id"`
}

// PostResponse модель ответа с информацией о посте
type PostResponse struct {
	ID           int       `json:"id"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	MediaType    string    `json:"media_type"`
	MediaURL     string    `json:"media_url"`
	Author       UserBrief `json:"user"`
	Category     Category  `json:"category"`
	Status       string    `json:"status"`
	RejectReason *string   `json:"reject_reason,omitempty"`
	LikesCount   int       `json:"likes_count"`
	IsLiked      bool      `json:"is_liked"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// UserBrief краткая информация о пользователе для включения в ответ о посте
type UserBrief struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Nickname string `json:"nickname"`
	Avatar   string `json:"avatar"`
}

// PostModeration модель для модерации постов
type PostModeration struct {
	Status       string `json:"status" binding:"required,oneof=approved rejected"`
	RejectReason string `json:"message"`
}

// PostFilter модель для фильтрации постов
type PostFilter struct {
	CategoryID  int    `form:"category_id"`
	UserID      int    `form:"user_id"`
	SearchQuery string `form:"q"`
	Status      string `form:"status"`
	SortBy      string `form:"sort_by" binding:"omitempty,oneof=date popularity"`
	SortOrder   string `form:"sort_order" binding:"omitempty,oneof=asc desc"`
	Page        int    `form:"page" binding:"omitempty,min=1"`
	PerPage     int    `form:"per_page" binding:"omitempty,min=1,max=100"`
}

// FeedResponse модель ответа для ленты постов
type FeedResponse struct {
	Items      []PostResponse `json:"posts"`
	Pagination Pagination     `json:"pagination"`
}

// Pagination модель для информации о пагинации
type Pagination struct {
	Total   int `json:"total"`
	Page    int `json:"page"`
	PerPage int `json:"per_page"`
	Pages   int `json:"pages"`
}
