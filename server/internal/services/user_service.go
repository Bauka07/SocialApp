package services

import (
	"errors"
	"fmt"
	"net/mail"

	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Register Error Handler
func REH(user *models.User) error {

	if len(user.Password) < 6 {
		return fmt.Errorf("Password must be at least 6 characters")
	}
	if len(user.Username) < 3 || len(user.Username) > 30 {
		return fmt.Errorf("Username is too short. It must be 3 and 30 characters")
	}
	if user.Email == "" {
		return fmt.Errorf("Email is required")
	}
	if _, err := mail.ParseAddress(user.Email); err != nil {
		return fmt.Errorf("Invalid email format")
	}
	var existingUser models.User
	if err := database.DB.Where("email = ?", user.Email).First(&existingUser).Error; err == nil {
		return fmt.Errorf("Email already registered")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		// unexpected database error
		return fmt.Errorf("Database error: %v", err)
	}

	if err := database.DB.Where("username = ?", user.Username).First(&existingUser).Error; err == nil {
		return fmt.Errorf("Username already registered")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("Database error: %v", err)
	}
	return nil
}

func LEH(user *models.User) (*models.User, error) {
	if user.Email == "" {
		return nil, fmt.Errorf("Emails is required")
	}
	if user.Password == "" {
		return nil, fmt.Errorf("Password is required")
	}
	if _, err := mail.ParseAddress(user.Email); err != nil {
		return nil, fmt.Errorf("Invalid email format")
	}
	var existingUser models.User
	if err := database.DB.Where("email = ?", user.Email).First(&existingUser).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("User not fount")
		}

		return nil, fmt.Errorf("Database error: %v", err)
	}
	if err := bcrypt.CompareHashAndPassword([]byte(existingUser.Password), []byte(user.Password)); err != nil {
		return nil, fmt.Errorf("Invalid password")
	}

	return &existingUser, nil
}
