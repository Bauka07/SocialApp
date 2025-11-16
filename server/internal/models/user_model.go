package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`

	Username string `json:"username" gorm:"unique;not null;size:30"`
	Email    string `json:"email" gorm:"unique;not null"`
	Password string `json:"password,omitempty" gorm:"not null"`
	ImageURL string `json:"image_url,omitempty" gorm:"size:255"`

	Provider   string `json:"provider,omitempty" gorm:"size:20;default:'local'"`
	ProviderID string `json:"provider_id,omitempty" gorm:"size:100"`

	Posts []Post `json:"posts,omitempty" gorm:"foreignKey:UserID"`
}
