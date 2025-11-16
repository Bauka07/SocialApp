// controllers/feed_controller.go
package controllers

import (
	"net/http"
	"strconv"

	"github.com/Bauka07/SocialApp/internal/services"
	"github.com/gin-gonic/gin"
)

// GetSmartFeed returns algorithmically ranked posts with pagination
func GetSmartFeed(c *gin.Context) {
	var currentUserID uint = 0

	// Get current user if authenticated
	userVal, exists := c.Get("userID")
	if exists {
		if userIDStr, ok := userVal.(string); ok {
			if uid, err := strconv.ParseUint(userIDStr, 10, 32); err == nil {
				currentUserID = uint(uid)
			}
		}
	}

	// Get pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "0"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	// Validate
	if page < 0 {
		page = 0
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 10
	}

	posts, hasMore, err := services.GetSmartFeed(currentUserID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts":    posts,
		"page":     page,
		"has_more": hasMore,
	})
}

// GetTrendingPosts returns posts with high engagement
func GetTrendingPosts(c *gin.Context) {
	var currentUserID uint = 0

	userVal, exists := c.Get("userID")
	if exists {
		if userIDStr, ok := userVal.(string); ok {
			if uid, err := strconv.ParseUint(userIDStr, 10, 32); err == nil {
				currentUserID = uint(uid)
			}
		}
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 || limit > 50 {
		limit = 20
	}

	posts, err := services.GetTrendingPosts(currentUserID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts": posts,
	})
}
