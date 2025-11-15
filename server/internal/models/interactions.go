package models

import (
	"time"

	"gorm.io/gorm"
)

// Like represents a like on a post
type Like struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`

	UserID uint `json:"user_id" gorm:"not null;index:idx_user_post"`
	PostID uint `json:"post_id" gorm:"not null;index:idx_user_post"`

	User User `json:"user" gorm:"foreignKey:UserID"`
	Post Post `json:"-" gorm:"foreignKey:PostID"`
}

// Comment represents a comment on a post
type Comment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	PostID    uint      `gorm:"not null" json:"post_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type PostWithStats struct {
	Post
	LikesCount    int  `json:"likes_count"`
	CommentsCount int  `json:"comments_count"`
	IsLiked       bool `json:"is_liked"`
}
