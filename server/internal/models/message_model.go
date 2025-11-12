package models

import (
	"time"

	"gorm.io/gorm"
)

type Message struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`

	Content    string `json:"content" gorm:"not null;type:text"`
	SenderID   uint   `json:"sender_id" gorm:"not null;index"`
	ReceiverID uint   `json:"receiver_id" gorm:"not null;index"`
	IsRead     bool   `json:"is_read" gorm:"default:false"`

	// Deletion fields
	DeletedForSender   bool `json:"deleted_for_sender,omitempty" gorm:"default:false"`
	DeletedForReceiver bool `json:"deleted_for_receiver,omitempty" gorm:"default:false"`

	// Reply functionality - ADD THESE
	ReplyToID *uint    `json:"reply_to_id,omitempty" gorm:"index"`
	ReplyTo   *Message `json:"reply_to,omitempty" gorm:"foreignKey:ReplyToID"`

	// Relationships
	Sender   User `json:"sender,omitempty" gorm:"foreignKey:SenderID"`
	Receiver User `json:"receiver,omitempty" gorm:"foreignKey:ReceiverID"`
}
