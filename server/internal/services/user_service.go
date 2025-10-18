package services

import (
	"fmt"
	"net/mail"

	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
)

// Register Error Handler
func REH(user models.User) error {

	if len(user.Password) < 6 {
		return fmt.Errorf("Password must be at least 6 characters")
	}
	if len(user.Username) < 3 || len(user.Username) > 30 {
		return fmt.Errorf("Username is too short. It must be 6 and 30 characters")
	}
	if user.Email == "" {
		return fmt.Errorf("Email is required")
	}
	if _, err := mail.ParseAddress(user.Email); err != nil {
		return fmt.Errorf("Email is invalid")
	}
	var existingUser models.User
	if err := database.DB.Where("email = ?", user.Email).First(&existingUser).Error; err != nil {
		return fmt.Errorf("Email already registered")
	}

	if err := database.DB.Where("username = ?", user.Username).First(&existingUser).Error; err != nil {
		return fmt.Errorf("Username already registered")
	}

	return nil
}
