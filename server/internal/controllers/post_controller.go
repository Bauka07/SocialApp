package controllers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/Bauka07/SocialApp/internal/services"
	"github.com/gin-gonic/gin"
)

// CreatePost - Create a new post with optional image
func CreatePost(c *gin.Context) {
	// Get userID from JWT
	userVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userIDStr, ok := userVal.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID type"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID"})
		return
	}

	// Get title and content from form data
	title := c.PostForm("title")
	content := c.PostForm("content")

	// Create post first
	post, err := services.CreatePost(uint(userID), title, content)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if image is uploaded
	fileHeader, err := c.FormFile("image")
	if err == nil {
		// Image was provided
		if err := services.ValidateImageFile(fileHeader); err != nil {
			c.JSON(http.StatusCreated, gin.H{
				"message": "post created but image is invalid",
				"post":    post,
				"warning": err.Error(),
			})
			return
		}

		src, err := fileHeader.Open()
		if err != nil {
			c.JSON(http.StatusCreated, gin.H{
				"message": "post created but failed to read image",
				"post":    post,
			})
			return
		}
		defer src.Close()

		url, err := services.UpdatePostImage(post.ID, uint(userID), src)
		if err != nil {
			c.JSON(http.StatusCreated, gin.H{
				"message": "post created but image upload failed",
				"post":    post,
				"warning": err.Error(),
			})
			return
		}

		post.ImageURL = sql.NullString{String: url, Valid: true}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "post created successfully",
		"post":    post,
	})
}

// GetMyPosts - Get all posts by current user
func GetMyPosts(c *gin.Context) {
	userVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userIDStr, ok := userVal.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID type"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID"})
		return
	}

	posts, err := services.GetUserPosts(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts": posts,
	})
}

// GetPostByID - Get a single post
func GetPostByID(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post ID"})
		return
	}

	post, err := services.GetPostByID(uint(postID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"post": post,
	})
}

// GetPosts - Get all posts from all users (Dashboard feed)
func GetPosts(c *gin.Context) {
	posts, err := services.GetAllPosts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts": posts,
	})
}

// UpdatePost - Update post title and content
func UpdatePost(c *gin.Context) {
	userVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userIDStr, ok := userVal.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID type"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID"})
		return
	}

	postIDStr := c.Param("id")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post ID"})
		return
	}

	var req struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	post, err := services.UpdatePost(uint(postID), uint(userID), req.Title, req.Content)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "post updated successfully",
		"post":    post,
	})
}

// DeletePost - Delete a post
func DeletePost(c *gin.Context) {
	userVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userIDStr, ok := userVal.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID type"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID"})
		return
	}

	postIDStr := c.Param("id")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post ID"})
		return
	}

	if err := services.DeletePost(uint(postID), uint(userID)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "post deleted successfully",
	})
}

// UploadPostImage - Upload image for a post
func UploadPostImage(c *gin.Context) {
	userVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userIDStr, ok := userVal.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID type"})
		return
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID"})
		return
	}

	postIDStr := c.Param("id")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post ID"})
		return
	}

	// Get uploaded file
	fileHeader, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no image uploaded"})
		return
	}

	// Validate file
	if err := services.ValidateImageFile(fileHeader); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Open file
	src, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to open image"})
		return
	}
	defer src.Close()

	// Upload image
	url, err := services.UpdatePostImage(uint(postID), uint(userID), src)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "post image uploaded successfully",
		"image_url": url,
	})
}
