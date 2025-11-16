package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/middleware"
	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/Bauka07/SocialApp/internal/services"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

// -------------- HELPER FUNCTIONS --------------

func generateUsername(email string) string {
	parts := strings.Split(email, "@")
	return parts[0]
}

// -------------- STANDARD AUTH --------------

// Register user without reCAPTCHA (for internal use)
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
		Password: string(hashed),
		Provider: "local",
	}
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

// RegisterWithRecaptcha - Fixed version
func RegisterWithRecaptcha(c *gin.Context) {
	var req struct {
		Username       string `json:"username" binding:"required"`
		Email          string `json:"email" binding:"required"`
		Password       string `json:"password" binding:"required"`
		RecaptchaToken string `json:"recaptcha_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid Input!"})
		return
	}

	// Verify reCAPTCHA
	if err := services.VerifyRecaptcha(req.RecaptchaToken); err != nil {
		c.JSON(400, gin.H{"error": "reCAPTCHA verification failed"})
		return
	}

	// Create user struct for validation
	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: req.Password,
	}

	if err := services.REH(&user); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to hash password"})
		return
	}

	user.Password = string(hashed)
	user.Provider = "local"

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

// LoginWithRecaptcha
func LoginWithRecaptcha(c *gin.Context) {
	var req struct {
		Email          string `json:"email" binding:"required"`
		Password       string `json:"password" binding:"required"`
		RecaptchaToken string `json:"recaptcha_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid Input!"})
		return
	}

	// Verify reCAPTCHA
	if err := services.VerifyRecaptcha(req.RecaptchaToken); err != nil {
		c.JSON(400, gin.H{"error": "reCAPTCHA verification failed"})
		return
	}

	// Create user struct for login
	user := models.User{
		Email:    req.Email,
		Password: req.Password,
	}

	loggedInUser, err := services.LEH(&user)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	token, err := middleware.CreateToken(*loggedInUser)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create token"})
		return
	}

	c.JSON(200, gin.H{
		"message": "Logged in successfully",
		"token":   token,
		"user":    gin.H{"id": loggedInUser.ID},
	})
}

// -------------- GOOGLE OAUTH --------------

// GoogleLogin - Server-side OAuth flow (generates OAuth URL)
func GoogleLogin(c *gin.Context) {
	url := services.GoogleOAuthConfig.AuthCodeURL("state", oauth2.AccessTypeOffline)
	c.JSON(http.StatusOK, gin.H{"url": url})
}

// GoogleCallback - Server-side OAuth callback
func GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "code not found"})
		return
	}

	userInfo, err := services.GetGoogleUserInfo(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	result := database.DB.Where("provider = ? AND provider_id = ?", "google", userInfo.ID).First(&user)

	if result.Error == gorm.ErrRecordNotFound {
		// Create new user
		username := generateUsername(userInfo.Email)
		password := services.GenerateRandomPassword(16)
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

		user = models.User{
			Username:   username,
			Email:      userInfo.Email,
			Password:   string(hashedPassword),
			ImageURL:   userInfo.Picture,
			Provider:   "google",
			ProviderID: userInfo.ID,
		}

		if err := database.DB.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
			return
		}
	} else if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	token, err := middleware.CreateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create token"})
		return
	}

	// Redirect to frontend with token
	c.Redirect(http.StatusFound, "http://localhost:3000/auth/callback?token="+token)
}

// Google OAuth - Client-side flow handlers
type GoogleUserRequest struct {
	GoogleUser struct {
		ID            string `json:"id"`
		Email         string `json:"email"`
		VerifiedEmail bool   `json:"verified_email"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
	} `json:"google_user"`
}

func GoogleLoginClient(c *gin.Context) {
	var req GoogleUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	var user models.User
	result := database.DB.Where("provider = ? AND provider_id = ?", "google", req.GoogleUser.ID).First(&user)

	if result.Error == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found, please register first"})
		return
	} else if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	token, err := middleware.CreateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  gin.H{"id": user.ID},
	})
}

func GoogleRegisterClient(c *gin.Context) {
	var req GoogleUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	// Check if user already exists with this Google ID
	var existingUser models.User
	result := database.DB.Where("provider = ? AND provider_id = ?", "google", req.GoogleUser.ID).First(&existingUser)

	if result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "user already exists, please login"})
		return
	}

	// Check if email is already used
	result = database.DB.Where("email = ?", req.GoogleUser.Email).First(&existingUser)
	if result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already registered with another account"})
		return
	}

	// Create new user
	username := generateUsername(req.GoogleUser.Email)
	password := services.GenerateRandomPassword(16)
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	user := models.User{
		Username:   username,
		Email:      req.GoogleUser.Email,
		Password:   string(hashedPassword),
		ImageURL:   req.GoogleUser.Picture,
		Provider:   "google",
		ProviderID: req.GoogleUser.ID,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	token, err := middleware.CreateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  gin.H{"id": user.ID},
	})
}

// -------------- PROFILE MANAGEMENT --------------

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
	userVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

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

	fileHeader, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no image uploaded"})
		return
	}

	if err := services.ValidateImageFile(fileHeader); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	src, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to open image"})
		return
	}
	defer src.Close()

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	if user.ImageURL != "" {
		oldPublicID := fmt.Sprintf("socialapp_users/user_%d", userID)
		_ = services.DeleteUserImage(oldPublicID)
	}

	url, err := services.UploadUserImage(src, fmt.Sprintf("user_%d", userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed"})
		return
	}

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
	userVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

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

	if req.Username == "" && req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "provide username or email to update"})
		return
	}

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
	userVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

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

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
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

	if req.OldPassword == "" || req.NewPassword == "" || req.ConfirmNewPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "all password fields are required"})
		return
	}

	if req.NewPassword != req.ConfirmNewPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "new passwords do not match"})
		return
	}

	if err := services.UpdateUserPassword(uint(userID), req.OldPassword, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
}
