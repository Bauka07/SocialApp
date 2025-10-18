package controllers

import (
	"net/http"

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

func GetDashboard(c *gin.Context) {

	c.JSON(http.StatusOK, gin.H{
		"message":  "Welcome to your dashboard!",
		"username": "HELLOW",
		"email":    "hellow",
	})
}
