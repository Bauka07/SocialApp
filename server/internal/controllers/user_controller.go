package controllers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/middleware"
	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/Bauka07/SocialApp/internal/services"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var req models.User
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid Input!"})
		return
	}
	if err := services.REH(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to hash password"})
		return
	}
	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashed)}
	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(400, gin.H{"error": "Could not create user"})
		return
	}
	token, err := middleware.CreateToken(user)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create token"})
		return
	}
	c.JSON(201, gin.H{
		"message": "User registered successfully",
		"token":   token,
		"user":    gin.H{"id": user.ID},
	})
}

func Login(c *gin.Context) {
	var req models.User

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid Input!"})
		return
	}
	user, err := services.LEH(&req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	token, err := middleware.CreateToken(*user)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create token"})
		return
	}
	c.JSON(200, gin.H{
		"message": "Logged in successfully",
		"token":   token,
		"user":    gin.H{"id": user.ID},
	})
}

func GetMyProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var user models.User
	if err := database.DB.Preload("Posts").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":        user.ID,
			"username":  user.Username,
			"email":     user.Email,
			"image_url": user.ImageURL,
			"posts":     user.Posts,
		},
	})
}

func UploadProfileImage(c *gin.Context) {
	// Get userID from context (STRING from JWT)
	userVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Convert string to uint
	userIDStr, ok := userVal.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID type"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID"})
		return
	}

	// Get uploaded file
	fileHeader, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no image uploaded"})
		return
	}

	// Validate file
	if err := services.ValidateImageFile(fileHeader); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Open file
	src, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to open image"})
		return
	}
	defer src.Close()

	// Get current user to check for old image
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// Delete old image from Cloudinary if exists
	if user.ImageURL != "" {
		// Extract public_id from URL (e.g., socialapp_users/user_123)
		oldPublicID := fmt.Sprintf("socialapp_users/user_%d", userID)
		_ = services.DeleteUserImage(oldPublicID) // Ignore error if deletion fails
	}

	// Upload new image to Cloudinary
	url, err := services.UploadUserImage(src, fmt.Sprintf("user_%d", userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed"})
		return
	}

	// Update DB
	if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Update("image_url", url).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "image uploaded successfully",
		"image_url": url,
	})
}

func UpdateProfile(c *gin.Context) {
	// Get userID from context (it's a STRING from JWT)
	userVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Convert string to uint
	userIDStr, ok := userVal.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID type"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID"})
		return
	}

	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	// At least one field should be provided
	if req.Username == "" && req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "provide username or email to update"})
		return
	}

	// Call service to update profile
	user, err := services.UpdateUserProfile(uint(userID), req.Username, req.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "profile updated successfully",
		"user":    user,
	})
}

func UpdatePassword(c *gin.Context) {
	// Get userID from context (it's a STRING from JWT)
	userVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Convert string to uint
	userIDStr, ok := userVal.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID type"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID"})
		return
	}

	var req struct {
		OldPassword        string `json:"old_password"`
		NewPassword        string `json:"new_password"`
		ConfirmNewPassword string `json:"confirm_new_password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	// Validate input
	if req.OldPassword == "" || req.NewPassword == "" || req.ConfirmNewPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "all password fields are required"})
		return
	}

	// Check if new passwords match
	if req.NewPassword != req.ConfirmNewPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "new passwords do not match"})
		return
	}

	// Call service to update password
	if err := services.UpdateUserPassword(uint(userID), req.OldPassword, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
}
