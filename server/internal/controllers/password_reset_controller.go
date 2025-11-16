package controllers

import (
	"log"
	"net/http"
	"strings"

	"github.com/Bauka07/SocialApp/internal/services"
	"github.com/Bauka07/SocialApp/internal/utils"
	"github.com/gin-gonic/gin"
)

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type VerifyCodeRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required,len=6"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Code        string `json:"code" binding:"required,len=6"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// ForgotPassword initiates the password reset process
func ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("❌ Invalid request format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Normalize email
	email := strings.ToLower(strings.TrimSpace(req.Email))
	log.Printf("📧 Forgot password request for: %s", email)

	if err := services.InitiatePasswordReset(email); err != nil {
		// Log error but don't expose details to prevent user enumeration
		log.Printf("❌ Error in InitiatePasswordReset: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process request"})
		return
	}

	log.Printf("✅ Password reset initiated successfully for: %s", email)
	// Always return success to prevent email enumeration attacks
	c.JSON(http.StatusOK, gin.H{
		"message": "If an account exists with this email, you will receive a password reset code",
	})
}

// VerifyResetCode validates the OTP code
func VerifyResetCode(c *gin.Context) {
	var req VerifyCodeRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	code := strings.TrimSpace(req.Code)

	_, err := services.VerifyResetCode(email, code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Code verified successfully",
		"valid":   true,
	})
}

// ResetPassword changes the user's password
func ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	code := strings.TrimSpace(req.Code)

	// Validate password strength
	if len(req.NewPassword) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters"})
		return
	}

	if err := services.ResetPassword(email, code, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successfully",
	})
}
func TestEmail(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		c.JSON(400, gin.H{"error": "email parameter required"})
		return
	}

	err := utils.SendPasswordResetEmail(email, "Test User", "123456")
	if err != nil {
		log.Printf("Test email failed: %v", err)
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Test email sent successfully"})
}
