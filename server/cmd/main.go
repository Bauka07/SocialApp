package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/Bauka07/SocialApp/internal/config"
	"github.com/Bauka07/SocialApp/internal/controllers" // ← ADD THIS!
	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/Bauka07/SocialApp/internal/routes"
	"github.com/Bauka07/SocialApp/internal/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(".env"); err != nil {
		if err2 := godotenv.Load("../.env"); err2 != nil {
			log.Println("Warning: .env file not found, relying on environment variables")
		} else {
			log.Println(".env file loaded successfully (from parent dir)")
		}
	} else {
		log.Println(".env file loaded successfully")
	}

	config.InitConfig()
	config.InitCloudinary()
	services.InitGoogleOAuth()

	r := gin.Default()

	corsConfig := cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"*"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"*"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	r.Use(cors.New(corsConfig))

	log.Println("🚨 CORS is FULLY OPEN (DEV MODE ONLY) — do not use in production!")

	database.ConnectDB()

	if err := database.DB.AutoMigrate(
		&models.User{},
		&models.Contact{},
		&models.Post{},
		&models.Message{},
		&models.Like{},
		&models.Comment{},
		&models.PostWithStats{},
		&models.PasswordReset{},
	); err != nil {
		fmt.Println("Migration error:", err)
	} else {
		fmt.Println("Database migrated successfully")
	}

	// Health check at root
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Server Running Successfully..."})
	})

	// WebSocket at root level (not under /api)
	r.GET("/ws", controllers.WebSocketHandler)

	// All other routes under /api
	api := r.Group("/api")
	{
		routes.UserRoutes(api)
		routes.ContactRoutes(api)
		routes.PostRoutes(api)
		routes.ChatRoutes(api)
		routes.SetupPasswordResetRoutes(api)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on 0.0.0.0:%s...", port)
	log.Printf("📍 Routes configured:")
	log.Printf("   - WebSocket: ws://localhost:%s/ws", port)
	log.Printf("   - API: http://localhost:%s/api", port)

	r.Run("0.0.0.0:" + port)
}
