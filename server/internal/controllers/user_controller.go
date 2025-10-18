package controllers

import (
	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/Bauka07/SocialApp/internal/services"
	"github.com/gin-gonic/gin"
)

func Register(c *gin.Context) {
	var req models.User
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid Input!"})
		return
	}
	if err := services.REH(req); err != nil {
		c.JSON(400, err.Error())
	}
	user := models.User{Username: req.Username, Email: req.Email, Password: req.Password}
	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(400, gin.H{"error": "Could not create user"})
		return
	}

	c.JSON(200, gin.H{"message": "User registered successfully"})
}

func Login(c *gin.Context) {
	var req models.User

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid Input!"})
		return
	}

	var user models.User

	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(400, gin.H{"error": "User not found"})
		return
	}
	token := "s"
	c.JSON(200, gin.H{"message": "Logged in Successfully!", "token": token, "user": user.ID})
}
