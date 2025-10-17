package main

import (
	"fmt"
	"time"

	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/Bauka07/SocialApp/internal/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	//Connect DB
	database.ConnectDB()
	err := database.DB.AutoMigrate(&models.User{}, &models.Post{})
	fmt.Println(err)
	//Routes
	routes.UserRoutes(r)

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Server Running Successfully..."})
	})

	r.Run(":8080")
}
