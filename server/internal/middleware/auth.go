package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/Bauka07/SocialApp/internal/config"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Middleware to protect routes
func AuthCheck() gin.HandlerFunc {
	return func(c *gin.Context) {

		//Getting Token from Context Header
		authHeader := c.GetHeader("Authorization")

		//Checks is Header is empty
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Auth Header is Null"})
			c.Abort()
			return
		}

		tokenParts := strings.Split(authHeader, " ")

		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Auth Header"})
			c.Abort()
			return
		}

		tokenString := tokenParts[1] // Token

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return config.GetJWT(), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		if claims.ExpiresAt.Time.Before(time.Now()) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token expired"})
			c.Abort()
			return
		}

		c.Set("username", claims.Username)
		c.Set("email", claims.Email)
		c.Set("userID", claims.UserID)

		c.Next()
	}
}
