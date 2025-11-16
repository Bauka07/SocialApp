package services

import (
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"time"

	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/Bauka07/SocialApp/internal/utils"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	CodeExpirationMinutes = 15
	CodeLength            = 6
	MaxAttempts           = 5
)

// GenerateOTP creates a secure 6-digit code
func GenerateOTP() (string, error) {
	code := ""
	for i := 0; i < CodeLength; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			log.Printf("❌ Error generating OTP: %v", err)
			return "", fmt.Errorf("failed to generate secure random number: %w", err)
		}
		code += num.String()
	}
	log.Printf("✅ OTP generated successfully")
	return code, nil
}

// InitiatePasswordReset generates OTP and sends email
func InitiatePasswordReset(email string) error {
	log.Printf("🔄 Initiating password reset for: %s", email)

	// Check if user exists
	var user models.User
	if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Printf("⚠️ User not found with email: %s (returning success for security)", email)
			// Don't reveal if email exists (security best practice)
			// Still return nil to prevent user enumeration
			return nil
		}
		log.Printf("❌ Database error checking user: %v", err)
		return fmt.Errorf("database error: %w", err)
	}

	log.Printf("✅ User found: %s (ID: %d)", user.Username, user.ID)

	// Invalidate any existing active reset codes for this email
	result := database.DB.Model(&models.PasswordReset{}).
		Where("email = ? AND used = false AND expires_at > ?", email, time.Now()).
		Update("used", true)

	if result.Error != nil {
		log.Printf("⚠️ Warning: Could not invalidate old codes: %v", result.Error)
	} else if result.RowsAffected > 0 {
		log.Printf("✅ Invalidated %d existing reset codes", result.RowsAffected)
	}

	// Generate new OTP
	code, err := GenerateOTP()
	if err != nil {
		return fmt.Errorf("failed to generate OTP: %w", err)
	}

	// Create reset record
	passwordReset := models.PasswordReset{
		Email:     email,
		Code:      code,
		ExpiresAt: time.Now().Add(CodeExpirationMinutes * time.Minute),
		Used:      false,
		CreatedAt: time.Now(),
	}

	log.Printf("🔄 Creating password reset record...")
	if err := database.DB.Create(&passwordReset).Error; err != nil {
		log.Printf("❌ Failed to create reset record: %v", err)
		return fmt.Errorf("failed to create reset record: %w", err)
	}

	log.Printf("✅ Reset record created (ID: %d, Expires: %v)", passwordReset.ID, passwordReset.ExpiresAt)

	// Send email with OTP
	log.Printf("📧 Attempting to send password reset email to: %s", email)
	if err := utils.SendPasswordResetEmail(email, user.Username, code); err != nil {
		log.Printf("❌ CRITICAL: Failed to send email: %v", err)
		// Mark the reset code as used since email failed
		database.DB.Model(&passwordReset).Update("used", true)
		return fmt.Errorf("failed to send reset email: %w", err)
	}

	log.Printf("✅ Password reset email sent successfully to: %s", email)
	return nil
}

// VerifyResetCode validates the OTP code
func VerifyResetCode(email, code string) (*models.PasswordReset, error) {
	log.Printf("🔄 Verifying reset code for: %s", email)

	var reset models.PasswordReset

	err := database.DB.Where("email = ? AND code = ? AND used = false", email, code).
		First(&reset).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Printf("❌ Invalid or already used code for: %s", email)
			return nil, fmt.Errorf("invalid or expired code")
		}
		log.Printf("❌ Database error: %v", err)
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check expiration
	if reset.IsExpired() {
		log.Printf("❌ Code expired for: %s (expired at: %v, now: %v)", email, reset.ExpiresAt, time.Now())
		return nil, fmt.Errorf("code has expired")
	}

	log.Printf("✅ Code verified successfully for: %s (created: %v, expires: %v)",
		email, reset.CreatedAt, reset.ExpiresAt)
	return &reset, nil
}

// ResetPassword changes user password and marks code as used
func ResetPassword(email, code, newPassword string) error {
	log.Printf("🔄 Resetting password for: %s", email)

	// Verify the code first
	reset, err := VerifyResetCode(email, code)
	if err != nil {
		return err
	}

	// Validate password strength (basic validation)
	if len(newPassword) < 6 {
		return fmt.Errorf("password must be at least 6 characters long")
	}

	// Hash new password
	log.Printf("🔄 Hashing new password...")
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("❌ Failed to hash password: %v", err)
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Begin transaction
	tx := database.DB.Begin()
	if tx.Error != nil {
		log.Printf("❌ Failed to begin transaction: %v", tx.Error)
		return fmt.Errorf("transaction error: %w", tx.Error)
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			log.Printf("❌ Transaction panic recovered: %v", r)
		}
	}()

	// Update user password
	log.Printf("🔄 Updating user password in database...")
	result := tx.Model(&models.User{}).
		Where("email = ?", email).
		Update("password", string(hashedPassword))

	if result.Error != nil {
		tx.Rollback()
		log.Printf("❌ Failed to update password: %v", result.Error)
		return fmt.Errorf("failed to update password: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		tx.Rollback()
		log.Printf("❌ No user found with email: %s", email)
		return fmt.Errorf("user not found")
	}

	// Mark code as used
	log.Printf("🔄 Marking reset code as used...")
	if err := tx.Model(&reset).Update("used", true).Error; err != nil {
		tx.Rollback()
		log.Printf("❌ Failed to mark code as used: %v", err)
		return fmt.Errorf("failed to mark code as used: %w", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("❌ Transaction commit failed: %v", err)
		return fmt.Errorf("transaction failed: %w", err)
	}

	log.Printf("✅ Password reset successfully for: %s", email)
	return nil
}

// CleanupExpiredCodes removes old reset codes (run as cron job)
func CleanupExpiredCodes() error {
	log.Printf("🔄 Cleaning up expired password reset codes...")

	result := database.DB.Where(
		"expires_at < ? OR (used = true AND created_at < ?)",
		time.Now(),
		time.Now().Add(-24*time.Hour),
	).Delete(&models.PasswordReset{})

	if result.Error != nil {
		log.Printf("❌ Cleanup failed: %v", result.Error)
		return fmt.Errorf("cleanup failed: %w", result.Error)
	}

	log.Printf("✅ Cleaned up %d expired/used codes", result.RowsAffected)
	return nil
}
