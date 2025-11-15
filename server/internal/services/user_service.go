package services

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"mime/multipart"
	"net/mail"
	"strings"
	"unicode"

	"github.com/Bauka07/SocialApp/internal/config"
	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Register Error Handler
func REH(user *models.User) error {
	// Validate password strength using existing function
	if err := validatePasswordStrength(user.Password); err != nil {
		return err
	}

	// Username validation
	if len(user.Username) < 3 || len(user.Username) > 30 {
		return fmt.Errorf("username must be between 3 and 30 characters")
	}

	// Email validation
	if user.Email == "" {
		return fmt.Errorf("email is required")
	}
	if _, err := mail.ParseAddress(user.Email); err != nil {
		return fmt.Errorf("invalid email format")
	}

	// Check if email exists
	var existingUser models.User
	if err := database.DB.Where("email = ?", user.Email).First(&existingUser).Error; err == nil {
		return fmt.Errorf("email already registered")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("database error: %v", err)
	}

	// Check if username exists
	if err := database.DB.Where("username = ?", user.Username).First(&existingUser).Error; err == nil {
		return fmt.Errorf("username already registered")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("database error: %v", err)
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

// UploadUserImage uploads image to Cloudinary
func UploadUserImage(file multipart.File, fileName string) (string, error) {
	ctx := context.Background()

	uploadResult, err := config.Cloud.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:         "socialapp_users",
		PublicID:       fileName,
		Transformation: "c_fill,g_face,h_400,w_400", // Auto crop to 400x400
		Format:         "jpg",                       // Convert to JPG
		AllowedFormats: []string{"jpg", "png", "jpeg", "webp"},
	})
	if err != nil {
		return "", err
	}

	return uploadResult.SecureURL, nil
}

// DeleteUserImage deletes image from Cloudinary
func DeleteUserImage(publicID string) error {
	ctx := context.Background()

	_, err := config.Cloud.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID: publicID,
	})
	return err
}

// UpdateUserProfile - Can update username OR email independently
func UpdateUserProfile(userID uint, newUsername, newEmail string) (*models.User, error) {
	db := database.DB

	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	// Trim whitespace
	newUsername = strings.TrimSpace(newUsername)
	newEmail = strings.TrimSpace(newEmail)

	changed := false

	// Update USERNAME if provided and different
	if newUsername != "" && newUsername != user.Username {
		// Check if username already exists (excluding current user)
		var existing models.User
		err := db.Where("username = ? AND id != ?", newUsername, userID).First(&existing).Error
		if err == nil {
			// Found another user with this username
			return nil, errors.New("username already taken")
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			// Some other database error
			return nil, err
		}
		// Username is available
		user.Username = newUsername
		changed = true
	}

	// Update EMAIL if provided and different
	if newEmail != "" && newEmail != user.Email {
		// Basic email validation
		if !strings.Contains(newEmail, "@") {
			return nil, errors.New("invalid email format")
		}

		// Check if email already exists (excluding current user)
		var existing models.User
		err := db.Where("email = ? AND id != ?", newEmail, userID).First(&existing).Error
		if err == nil {
			// Found another user with this email
			return nil, errors.New("email already exists")
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			// Some other database error
			return nil, err
		}
		// Email is available
		user.Email = newEmail
		changed = true
	}

	// Save only if something changed
	if !changed {
		return nil, errors.New("no changes to save")
	}

	if err := db.Save(&user).Error; err != nil {
		return nil, errors.New("failed to save changes")
	}

	user.Password = "" // Hide password
	return &user, nil
}

// UpdateUserPassword - Password change logic
func UpdateUserPassword(userID uint, oldPassword, newPassword string) error {
	db := database.DB

	var user models.User
	if err := db.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return errors.New("failed to retrieve user")
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPassword)); err != nil {
		return errors.New("current password is incorrect")
	}

	// Check if new password is same as old
	if oldPassword == newPassword {
		return errors.New("new password must be different from current password")
	}

	// Validate new password strength
	if err := validatePasswordStrength(newPassword); err != nil {
		return err
	}

	// Hash new password
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to process new password")
	}

	// Update password
	user.Password = string(hashed)
	if err := db.Save(&user).Error; err != nil {
		return errors.New("failed to update password")
	}

	return nil
}

// validatePasswordStrength - Helper function for password validation
func validatePasswordStrength(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters long")
	}

	if len(password) > 72 {
		return errors.New("password must not exceed 72 characters")
	}

	// Optional: Add complexity requirements
	hasUpper := false
	hasLower := false
	hasDigit := false

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsDigit(char):
			hasDigit = true
		}
	}

	if !hasUpper || !hasLower || !hasDigit {
		return errors.New("password must contain uppercase, lowercase, and numbers")
	}

	return nil
}

// GenerateRandomPassword creates a secure random password for OAuth users
func GenerateRandomPassword(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
	password := make([]byte, length)

	for i := range password {
		// Use crypto/rand for secure random numbers
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			// Fallback to a simple approach if crypto/rand fails
			password[i] = charset[i%len(charset)]
			continue
		}
		password[i] = charset[num.Int64()]
	}

	return string(password)
}
