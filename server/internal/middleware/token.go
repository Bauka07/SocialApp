package middleware

import (
	"fmt"
	"time"

	"github.com/Bauka07/SocialApp/internal/config"
	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID   string `json:"userID"`
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

func CreateToken(user models.User) (string, error) {
	expirationTime := time.Now().Add(time.Hour * 24)

	claims := &Claims{
		UserID:   fmt.Sprintf("%d", user.ID),
		Username: user.Username,
		Email:    user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(config.GetJWT())
	if err != nil {
		return "", fmt.Errorf("cannot create token: %w", err)
	}

	return tokenString, nil
}
