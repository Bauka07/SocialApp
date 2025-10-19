package config

import (
	"log"
	"os"
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
