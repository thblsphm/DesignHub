package models

import "time"

// Comment представляет модель комментария
type Comment struct {
	ID        int       `json:"id" db:"id"`
	Content   string    `json:"content" db:"content"`
	UserID    int       `json:"user_id" db:"user_id"`
	PostID    int       `json:"post_id" db:"post_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// CommentCreate модель для создания комментария
type CommentCreate struct {
	Content string `json:"content" binding:"required,min=1,max=500"`
	PostID  int    `json:"post_id" binding:"required"`
}

// CommentUpdate модель для обновления комментария
type CommentUpdate struct {
	Content string `json:"content" binding:"required,min=1,max=500"`
}

// CommentResponse модель ответа с информацией о комментарии
type CommentResponse struct {
	ID        int       `json:"id"`
	Content   string    `json:"content"`
	User      UserBrief `json:"user"`
	PostID    int       `json:"post_id"`
	CreatedAt time.Time `json:"created_at"`
}
