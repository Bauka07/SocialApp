package config

import (
	"log"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
)

var JWTSecret []byte

// InitConfig initializes all configuration from environment variables
func InitConfig() {
	// Initialize JWT Secret
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Fatal("JWT_SECRET environment variable not set")
	}
	JWTSecret = []byte(secret)
	log.Println("Configuration loaded successfully")
}

// GetJWT returns the JWT secret key
func GetJWT() []byte {
	return JWTSecret
}

var Cloud *cloudinary.Cloudinary

func InitCloudinary() {
	url := os.Getenv("CLOUDINARY_URL")
	if url == "" {
		log.Fatal("❌ CLOUDINARY_URL not found in .env")
	}

	cld, err := cloudinary.NewFromURL(url)
	if err != nil {
		log.Fatalf("❌ Failed to connect to Cloudinary: %v", err)
	}

	Cloud = cld
	log.Println("✅ Cloudinary connected successfully")
}
