package models

import "time"

// Like представляет модель лайка
type Like struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	PostID    int       `json:"post_id" db:"post_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// LikeCreate модель для создания лайка
type LikeCreate struct {
	PostID int `json:"post_id" binding:"required"`
}

// LikeResponse модель ответа с информацией о лайке
type LikeResponse struct {
	ID        int       `json:"id"`
	User      UserBrief `json:"user"`
	PostID    int       `json:"post_id"`
	CreatedAt time.Time `json:"created_at"`
}
