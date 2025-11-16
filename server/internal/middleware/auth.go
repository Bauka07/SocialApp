package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/Bauka07/SocialApp/internal/config"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthCheck - Middleware to protect routes (REQUIRED auth)
func AuthCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")

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

		tokenString := tokenParts[1]

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

// OptionalAuth - Checks for auth but doesn't block if missing
func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.Next()
			return
		}

		tokenString := tokenParts[1]

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return config.GetJWT(), nil
		})

		if err != nil || !token.Valid {
			c.Next()
			return
		}

		if claims.ExpiresAt.Time.Before(time.Now()) {
			c.Next()
			return
		}

		c.Set("username", claims.Username)
		c.Set("email", claims.Email)
		c.Set("userID", claims.UserID)

		c.Next()
	}
}
