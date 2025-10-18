// internal/models/contact.go
package models

import "time"

type Contact struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Email     string    `gorm:"not null" json:"email"`
	Message   string    `gorm:"type:text;not null" json:"message"`
	Status    string    `gorm:"default:'unread'" json:"status"` // unread, read, replied
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
