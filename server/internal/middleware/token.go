package middleware

import (
	"fmt"
	"time"

	"github.com/Bauka07/SocialApp/internal/config"
	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/golang-jwt/jwt/v5"
)

// Struct for JWT
type Claims struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

// Creates Token
func CreateToken(user models.User) (string, error) {

	expirationTime := time.Now().Add(time.Minute * 15)

	claims := &Claims{
		Username: user.Username,
		Email:    user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(config.GetJWT())

	if err != nil {
		return "", fmt.Errorf("Can not create token: %w", err)
	}

	return tokenString, nil
}
