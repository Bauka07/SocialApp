package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/Bauka07/SocialApp/internal/config"
	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/Bauka07/SocialApp/internal/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env from parent directory
	// Try to load .env from current directory
	if err := godotenv.Load(".env"); err != nil {
		// If not found, try one level up (for Air builds)
		if err2 := godotenv.Load("../.env"); err2 != nil {
			log.Println("Warning: .env file not found, relying on environment variables")
		} else {
			log.Println(".env file loaded successfully (from parent dir)")
		}
	} else {
		log.Println(".env file loaded successfully")
	}

	// Initialize configuration (JWT, etc.)
	config.InitConfig()

	// Initialize Gin
	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Connect to the database
	database.ConnectDB()
	if err := database.DB.AutoMigrate(&models.User{}, &models.Contact{}); err != nil {
		fmt.Println("Migration error:", err)
	} else {
		fmt.Println("Database migrated successfully")
	}

	// Routes
	routes.UserRoutes(r)
	routes.ContactRoutes(r)

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Server Running Successfully..."})
	})

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
