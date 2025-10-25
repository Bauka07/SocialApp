package models

import (
	"database/sql"
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type Post struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`

	Title    string         `json:"title" gorm:"not null;size:200"`
	Content  string         `json:"content" gorm:"not null;type:text"`
	ImageURL sql.NullString `json:"-" gorm:"size:255"`
	UserID   uint           `json:"user_id" gorm:"not null;index"`
	User     User           `json:"user" gorm:"foreignKey:UserID"`
}

// Custom JSON marshaling to handle sql.NullString properly
func (p Post) MarshalJSON() ([]byte, error) {
	type Alias Post
	return json.Marshal(&struct {
		*Alias
		ImageURL string `json:"image_url,omitempty"`
	}{
		Alias:    (*Alias)(&p),
		ImageURL: p.ImageURL.String, // Extract string value
	})
}
