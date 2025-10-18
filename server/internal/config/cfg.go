package config

import "os"

var jwtKey = []byte("BaukaGOI")

func GetJWT() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "my_super_secret" // fallback
	}
	return []byte(secret)
}
