package services

import (
	"errors"
	"strings"

	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
	"gorm.io/gorm"
)

// ToggleLikeWithCount - Like or unlike a post and return the new state with count
func ToggleLikeWithCount(userID, postID uint) (bool, int64, error) {
	db := database.DB

	// Check if post exists
	var post models.Post
	if err := db.First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, 0, errors.New("post not found")
		}
		return false, 0, errors.New("failed to fetch post")
	}

	// Use transaction to ensure consistency
	var isLiked bool
	var likesCount int64

	err := db.Transaction(func(tx *gorm.DB) error {
		// Check if like exists
		var like models.Like
		err := tx.Where("user_id = ? AND post_id = ?", userID, postID).First(&like).Error

		if err == nil {
			// Like exists, remove it (unlike)
			if err := tx.Delete(&like).Error; err != nil {
				return errors.New("failed to unlike post")
			}
			isLiked = false
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			// Like doesn't exist, create it
			like = models.Like{
				UserID: userID,
				PostID: postID,
			}
			if err := tx.Create(&like).Error; err != nil {
				return errors.New("failed to like post")
			}
			isLiked = true
		} else {
			return errors.New("failed to check like status")
		}

		// Get updated count
		if err := tx.Model(&models.Like{}).
			Where("post_id = ?", postID).
			Count(&likesCount).Error; err != nil {
			return errors.New("failed to count likes")
		}

		return nil
	})

	if err != nil {
		return false, 0, err
	}

	return isLiked, likesCount, nil
}

// ToggleLike - Like or unlike a post (kept for backwards compatibility)
func ToggleLike(userID, postID uint) (bool, error) {
	liked, _, err := ToggleLikeWithCount(userID, postID)
	return liked, err
}

// GetPostLikes - Get all likes for a post
func GetPostLikes(postID uint) ([]models.Like, error) {
	var likes []models.Like
	if err := database.DB.Where("post_id = ?", postID).
		Preload("User").
		Find(&likes).Error; err != nil {
		return nil, errors.New("failed to fetch likes")
	}

	// Clear passwords
	for i := range likes {
		likes[i].User.Password = ""
	}

	return likes, nil
}

// GetLikesCount - Get total likes for a post
func GetLikesCount(postID uint) (int64, error) {
	var count int64
	if err := database.DB.Model(&models.Like{}).
		Where("post_id = ?", postID).
		Count(&count).Error; err != nil {
		return 0, errors.New("failed to count likes")
	}
	return count, nil
}

// IsPostLikedByUser - Check if user liked a post
func IsPostLikedByUser(userID, postID uint) (bool, error) {
	// Handle case where userID is 0 (not logged in)
	if userID == 0 {
		return false, nil
	}

	var count int64
	if err := database.DB.Model(&models.Like{}).
		Where("user_id = ? AND post_id = ?", userID, postID).
		Count(&count).Error; err != nil {
		return false, errors.New("failed to check like status")
	}
	return count > 0, nil
}

// CreateComment - Create a comment on a post
func CreateComment(userID, postID uint, content string) (*models.Comment, error) {
	db := database.DB

	// Validate content
	content = strings.TrimSpace(content)
	if content == "" {
		return nil, errors.New("comment content is required")
	}

	if len(content) > 1000 {
		return nil, errors.New("comment must not exceed 1000 characters")
	}

	// Check if post exists
	var post models.Post
	if err := db.First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("post not found")
		}
		return nil, errors.New("failed to fetch post")
	}

	// Create comment
	comment := models.Comment{
		Content: content,
		UserID:  userID,
		PostID:  postID,
	}

	if err := db.Create(&comment).Error; err != nil {
		return nil, errors.New("failed to create comment")
	}

	// Load user data
	if err := db.Preload("User").First(&comment, comment.ID).Error; err != nil {
		return nil, errors.New("failed to load comment with user")
	}
	comment.User.Password = ""

	return &comment, nil
}

// GetPostComments - Get all comments for a post
func GetPostComments(postID uint) ([]models.Comment, error) {
	var comments []models.Comment
	if err := database.DB.Where("post_id = ?", postID).
		Preload("User").
		Order("created_at DESC").
		Find(&comments).Error; err != nil {
		return nil, errors.New("failed to fetch comments")
	}

	// Clear passwords
	for i := range comments {
		comments[i].User.Password = ""
	}

	return comments, nil
}

// GetCommentsCount - Get total comments for a post
func GetCommentsCount(postID uint) (int64, error) {
	var count int64
	if err := database.DB.Model(&models.Comment{}).
		Where("post_id = ?", postID).
		Count(&count).Error; err != nil {
		return 0, errors.New("failed to count comments")
	}
	return count, nil
}

// DeleteComment - Delete a comment
func DeleteComment(commentID, userID uint) error {
	var comment models.Comment

	// Find comment
	if err := database.DB.First(&comment, commentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("comment not found")
		}
		return errors.New("failed to fetch comment")
	}

	// Check ownership
	if comment.UserID != userID {
		return errors.New("you don't have permission to delete this comment")
	}

	// Delete comment
	if err := database.DB.Delete(&comment).Error; err != nil {
		return errors.New("failed to delete comment")
	}

	return nil
}

// UpdateComment - Update a comment
func UpdateComment(commentID, userID uint, content string) (*models.Comment, error) {
	var comment models.Comment

	// Find comment
	if err := database.DB.First(&comment, commentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("comment not found")
		}
		return nil, errors.New("failed to fetch comment")
	}

	// Check ownership
	if comment.UserID != userID {
		return nil, errors.New("you don't have permission to edit this comment")
	}

	// Validate content
	content = strings.TrimSpace(content)
	if content == "" {
		return nil, errors.New("comment content is required")
	}

	if len(content) > 1000 {
		return nil, errors.New("comment must not exceed 1000 characters")
	}

	// Update
	comment.Content = content

	if err := database.DB.Save(&comment).Error; err != nil {
		return nil, errors.New("failed to update comment")
	}

	// Reload with user
	if err := database.DB.Preload("User").First(&comment, comment.ID).Error; err != nil {
		return nil, errors.New("failed to reload comment")
	}
	comment.User.Password = ""

	return &comment, nil
}

// GetUserLikedPosts - Get all posts liked by user
func GetUserLikedPosts(userID uint) ([]map[string]interface{}, error) {
	var posts []models.Post

	if err := database.DB.
		Joins("JOIN likes ON likes.post_id = posts.id").
		Where("likes.user_id = ?", userID).
		Preload("User").
		Group("posts.id").
		Order("posts.created_at DESC").
		Find(&posts).Error; err != nil {
		return nil, errors.New("failed to fetch liked posts")
	}

	// Build response with stats
	result := make([]map[string]interface{}, len(posts))
	for i, post := range posts {
		// Get likes count
		likesCount, _ := GetLikesCount(post.ID)

		// Get comments count
		commentsCount, _ := GetCommentsCount(post.ID)

		// Clear password
		post.User.Password = ""

		result[i] = map[string]interface{}{
			"id":             post.ID,
			"title":          post.Title,
			"content":        post.Content,
			"image_url":      post.ImageURL.String,
			"created_at":     post.CreatedAt,
			"updated_at":     post.UpdatedAt,
			"user_id":        post.UserID,
			"user":           post.User,
			"likes_count":    likesCount,
			"comments_count": commentsCount,
			"is_liked":       true,
		}
	}

	return result, nil
}
