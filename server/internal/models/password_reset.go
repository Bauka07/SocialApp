package models

import (
	"time"
)

// PasswordReset stores OTP codes for password reset
type PasswordReset struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"not null;index" json:"email"`
	Code      string    `gorm:"not null" json:"code"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	Used      bool      `gorm:"default:false" json:"used"`
	CreatedAt time.Time `json:"created_at"`
}

// IsExpired checks if the reset code has expired
func (pr *PasswordReset) IsExpired() bool {
	return time.Now().After(pr.ExpiresAt)
}

// IsValid checks if code is valid (not expired and not used)
func (pr *PasswordReset) IsValid() bool {
	return !pr.IsExpired() && !pr.Used
}
