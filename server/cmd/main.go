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
	config.InitCloudinary()

	// Initialize Gin
	r := gin.Default()

	// CORS configuration - ALWAYS allow all origins in development
	corsConfig := cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	r.Use(cors.New(corsConfig))

	log.Println("✅ CORS enabled for all origins")

	// Connect to the database
	database.ConnectDB()

	// IMPORTANT: Include Message model in AutoMigrate
	if err := database.DB.AutoMigrate(
		&models.User{},
		&models.Contact{},
		&models.Post{},
		&models.Message{},
		&models.Like{},
		&models.Comment{},
		&models.PostWithStats{},
	); err != nil {
		fmt.Println("Migration error:", err)
	} else {
		fmt.Println("Database migrated successfully")
	}

	// Routes
	routes.UserRoutes(r)
	routes.ContactRoutes(r)
	routes.PostRoutes(r)
	routes.ChatRoutes(r)

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Server Running Successfully..."})
	})

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Listen on all interfaces (0.0.0.0) to allow external connections
	log.Printf("🚀 Server starting on 0.0.0.0:%s...", port)
	log.Printf("📍 Access via:")
	log.Printf("   - http://localhost:%s", port)
	log.Printf("   - http://127.0.0.1:%s", port)
	log.Printf("   - http://26.176.162.130:%s (if this is your IP)", port)

	r.Run("0.0.0.0:" + port)
}
