package models

import "time"

// Category представляет модель категории
type Category struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Slug      string    `json:"slug" db:"slug"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// CategoryCreate модель для создания категории
type CategoryCreate struct {
	Name string `json:"name" binding:"required,min=2,max=50"`
}

// CategoryUpdate модель для обновления категории
type CategoryUpdate struct {
	Name string `json:"name" binding:"required,min=2,max=50"`
}
