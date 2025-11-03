package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"mime/multipart"
	"strings"

	"github.com/Bauka07/SocialApp/internal/config"
	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"gorm.io/gorm"
)

// CreatePost creates a new post
func CreatePost(userID uint, title, content string) (*models.Post, error) {
	db := database.DB

	// Validate input
	title = strings.TrimSpace(title)
	content = strings.TrimSpace(content)

	if title == "" {
		return nil, errors.New("title is required")
	}

	if content == "" {
		return nil, errors.New("content is required")
	}

	if len(title) > 200 {
		return nil, errors.New("title must not exceed 200 characters")
	}

	// Create post (ImageURL will be empty by default)
	post := models.Post{
		Title:   title,
		Content: content,
		UserID:  userID,
	}

	if err := db.Create(&post).Error; err != nil {
		return nil, errors.New("failed to create post")
	}

	// Load user data
	db.Preload("User").First(&post, post.ID)

	return &post, nil
}

// GetAllPosts gets all posts from all users (for dashboard feed)
func GetAllPosts() ([]models.Post, error) {
	var posts []models.Post

	if err := database.DB.
		Preload("User").
		Order("created_at DESC").
		Find(&posts).Error; err != nil {
		return nil, errors.New("failed to fetch posts")
	}

	// Clear passwords from user data
	for i := range posts {
		posts[i].User.Password = ""
	}

	return posts, nil
}

// GetUserPosts gets all posts by a user
func GetUserPosts(userID uint) ([]models.Post, error) {
	var posts []models.Post

	if err := database.DB.Where("user_id = ?", userID).
		Preload("User").
		Order("created_at DESC").
		Find(&posts).Error; err != nil {
		return nil, errors.New("failed to fetch posts")
	}

	return posts, nil
}

// GetPostByID gets a single post by ID
func GetPostByID(postID uint) (*models.Post, error) {
	var post models.Post

	if err := database.DB.Preload("User").First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("post not found")
		}
		return nil, errors.New("failed to fetch post")
	}

	return &post, nil
}

// UpdatePost updates a post's title and content
func UpdatePost(postID, userID uint, title, content string) (*models.Post, error) {
	var post models.Post

	// Find post
	if err := database.DB.First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("post not found")
		}
		return nil, errors.New("failed to fetch post")
	}

	// Check ownership
	if post.UserID != userID {
		return nil, errors.New("you don't have permission to edit this post")
	}

	// Validate input
	title = strings.TrimSpace(title)
	content = strings.TrimSpace(content)

	if title == "" {
		return nil, errors.New("title is required")
	}

	if content == "" {
		return nil, errors.New("content is required")
	}

	if len(title) > 200 {
		return nil, errors.New("title must not exceed 200 characters")
	}

	// Update
	post.Title = title
	post.Content = content

	if err := database.DB.Save(&post).Error; err != nil {
		return nil, errors.New("failed to update post")
	}

	// Reload with user
	database.DB.Preload("User").First(&post, post.ID)

	return &post, nil
}

// DeletePost deletes a post
func DeletePost(postID, userID uint) error {
	var post models.Post

	// Find post
	if err := database.DB.First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("post not found")
		}
		return errors.New("failed to fetch post")
	}

	// Check ownership
	if post.UserID != userID {
		return errors.New("you don't have permission to delete this post")
	}

	// Delete image from Cloudinary if exists
	if post.ImageURL.Valid && post.ImageURL.String != "" {
		publicID := extractPublicIDFromURL(post.ImageURL.String, "socialapp_posts")
		if publicID != "" {
			_ = DeletePostImage(publicID) // Ignore error, still delete post
		}
	}

	// Delete post
	if err := database.DB.Delete(&post).Error; err != nil {
		return errors.New("failed to delete post")
	}

	return nil
}

// UpdatePostImage uploads and updates post image
func UpdatePostImage(postID, userID uint, file multipart.File) (string, error) {
	var post models.Post

	if err := database.DB.First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errors.New("post not found")
		}
		return "", errors.New("failed to fetch post")
	}

	if post.UserID != userID {
		return "", errors.New("you don't have permission to edit this post")
	}

	fileName := fmt.Sprintf("post_%d_%d", userID, postID)
	url, err := UploadPostImage(file, fileName)
	if err != nil {
		return "", errors.New("failed to upload image")
	}

	// CRITICAL: Save URL to database
	post.ImageURL = sql.NullString{String: url, Valid: true}
	if err := database.DB.Save(&post).Error; err != nil {
		return "", errors.New("failed to save image URL to database")
	}

	return url, nil
}

// UploadPostImage uploads post image to Cloudinary
func UploadPostImage(file multipart.File, fileName string) (string, error) {
	ctx := context.Background()

	uploadResult, err := config.Cloud.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:         "socialapp_posts",
		PublicID:       fileName,
		Transformation: "c_limit,w_1200,h_1200", // Max 1200x1200
		Format:         "jpg",
		AllowedFormats: []string{"jpg", "png", "jpeg", "webp"},
	})
	if err != nil {
		return "", err
	}

	return uploadResult.SecureURL, nil
}

// DeletePostImage deletes post image from Cloudinary
func DeletePostImage(publicID string) error {
	ctx := context.Background()

	_, err := config.Cloud.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID: publicID,
	})
	return err
}

// extractPublicIDFromURL extracts Cloudinary public ID from URL
func extractPublicIDFromURL(url, folder string) string {
	// Example URL: https://res.cloudinary.com/.../socialapp_posts/post_1_123.jpg
	parts := strings.Split(url, "/")
	for i, part := range parts {
		if part == folder && i+1 < len(parts) {
			filename := parts[i+1]
			// Remove extension
			return folder + "/" + strings.TrimSuffix(filename, ".jpg")
		}
	}
	return ""
}

// REMOVED: ValidatePostImageFile - Use ValidateImageFile from image_utils.go instead
