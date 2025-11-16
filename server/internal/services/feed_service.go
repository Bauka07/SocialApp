// services/feed_service.go
package services

import (
	"errors"
	"math"
	"sort"
	"time"

	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
)

type FeedPost struct {
	ID            uint                   `json:"id"`
	Title         string                 `json:"title"`
	Content       string                 `json:"content"`
	ImageURL      string                 `json:"image_url"`
	CreatedAt     time.Time              `json:"created_at"`
	UpdatedAt     time.Time              `json:"updated_at"`
	UserID        uint                   `json:"user_id"`
	User          map[string]interface{} `json:"user"`
	LikesCount    int64                  `json:"likes_count"`
	CommentsCount int64                  `json:"comments_count"`
	IsLiked       bool                   `json:"is_liked"`
	Score         float64                `json:"-"`
}

// GetSmartFeed returns algorithmically ranked posts with proper pagination
func GetSmartFeed(currentUserID uint, page, pageSize int) ([]map[string]interface{}, bool, error) {
	// Strategy for true infinite scroll with ALL posts:
	// 1. Fetch ALL posts from database (no date limit, no count limit)
	// 2. Score and rank ALL posts by algorithm
	// 3. Apply pagination to the RANKED results
	// 4. This ensures ALL posts appear eventually, sorted by trending/engagement

	var posts []models.Post

	// FETCH ALL POSTS - No date filter, no limit!
	if err := database.DB.
		Preload("User").
		Order("created_at DESC"). // Get newest first for faster scoring
		Find(&posts).Error; err != nil {
		return nil, false, errors.New("failed to fetch posts")
	}

	if len(posts) == 0 {
		return []map[string]interface{}{}, false, nil
	}

	// Log for debugging
	// fmt.Printf("DEBUG: Fetched %d total posts for ranking\n", len(posts))

	// Get user interaction preferences (with fixed SQL)
	userInteractions := getUserInteractionScore(currentUserID)

	// Score all fetched posts
	scoredPosts := make([]FeedPost, 0, len(posts))

	for _, post := range posts {
		likesCount, _ := GetLikesCount(post.ID)
		commentsCount, _ := GetCommentsCount(post.ID)
		isLiked, _ := IsPostLikedByUser(currentUserID, post.ID)

		score := calculatePostScore(
			post.CreatedAt,
			int(likesCount),
			int(commentsCount),
			userInteractions[post.UserID],
		)

		post.User.Password = ""

		feedPost := FeedPost{
			ID:        post.ID,
			Title:     post.Title,
			Content:   post.Content,
			ImageURL:  post.ImageURL.String,
			CreatedAt: post.CreatedAt,
			UpdatedAt: post.UpdatedAt,
			UserID:    post.UserID,
			User: map[string]interface{}{
				"id":        post.User.ID,
				"username":  post.User.Username,
				"email":     post.User.Email,
				"image_url": post.User.ImageURL,
			},
			LikesCount:    likesCount,
			CommentsCount: commentsCount,
			IsLiked:       isLiked,
			Score:         score,
		}

		scoredPosts = append(scoredPosts, feedPost)
	}

	// Sort by score using Go's built-in sort (efficient)
	sort.Slice(scoredPosts, func(i, j int) bool {
		return scoredPosts[i].Score > scoredPosts[j].Score
	})

	// Apply pagination to RANKED results
	totalRanked := len(scoredPosts)
	offset := page * pageSize

	// Check if there are more posts after this page
	hasMore := offset+pageSize < totalRanked

	// Handle edge cases
	if offset >= totalRanked {
		return []map[string]interface{}{}, false, nil
	}

	end := offset + pageSize
	if end > totalRanked {
		end = totalRanked
		hasMore = false
	}

	paginatedPosts := scoredPosts[offset:end]

	// Convert to response format
	result := make([]map[string]interface{}, len(paginatedPosts))
	for i, post := range paginatedPosts {
		result[i] = map[string]interface{}{
			"id":             post.ID,
			"title":          post.Title,
			"content":        post.Content,
			"image_url":      post.ImageURL,
			"created_at":     post.CreatedAt,
			"updated_at":     post.UpdatedAt,
			"user_id":        post.UserID,
			"user":           post.User,
			"likes_count":    post.LikesCount,
			"comments_count": post.CommentsCount,
			"is_liked":       post.IsLiked,
		}
	}

	return result, hasMore, nil
}

// GetTrendingPosts returns highly engaged posts from last 48 hours
func GetTrendingPosts(currentUserID uint, limit int) ([]map[string]interface{}, error) {
	twoDaysAgo := time.Now().AddDate(0, 0, -2)

	var posts []models.Post
	if err := database.DB.
		Preload("User").
		Where("created_at > ?", twoDaysAgo).
		Order("created_at DESC").
		Limit(limit * 2). // Fetch 2x to rank
		Find(&posts).Error; err != nil {
		return nil, errors.New("failed to fetch trending posts")
	}

	if len(posts) == 0 {
		return []map[string]interface{}{}, nil
	}

	// Score posts based on engagement only
	scoredPosts := make([]FeedPost, 0, len(posts))

	for _, post := range posts {
		likesCount, _ := GetLikesCount(post.ID)
		commentsCount, _ := GetCommentsCount(post.ID)
		isLiked, _ := IsPostLikedByUser(currentUserID, post.ID)

		// Engagement-only score for trending
		engagementScore := float64(likesCount) + float64(commentsCount)*3.0

		post.User.Password = ""

		feedPost := FeedPost{
			ID:        post.ID,
			Title:     post.Title,
			Content:   post.Content,
			ImageURL:  post.ImageURL.String,
			CreatedAt: post.CreatedAt,
			UpdatedAt: post.UpdatedAt,
			UserID:    post.UserID,
			User: map[string]interface{}{
				"id":        post.User.ID,
				"username":  post.User.Username,
				"email":     post.User.Email,
				"image_url": post.User.ImageURL,
			},
			LikesCount:    likesCount,
			CommentsCount: commentsCount,
			IsLiked:       isLiked,
			Score:         engagementScore,
		}

		scoredPosts = append(scoredPosts, feedPost)
	}

	// Sort by engagement using built-in sort
	sort.Slice(scoredPosts, func(i, j int) bool {
		return scoredPosts[i].Score > scoredPosts[j].Score
	})

	// Take top N
	if len(scoredPosts) > limit {
		scoredPosts = scoredPosts[:limit]
	}

	// Convert to response
	result := make([]map[string]interface{}, len(scoredPosts))
	for i, post := range scoredPosts {
		result[i] = map[string]interface{}{
			"id":             post.ID,
			"title":          post.Title,
			"content":        post.Content,
			"image_url":      post.ImageURL,
			"created_at":     post.CreatedAt,
			"updated_at":     post.UpdatedAt,
			"user_id":        post.UserID,
			"user":           post.User,
			"likes_count":    post.LikesCount,
			"comments_count": post.CommentsCount,
			"is_liked":       post.IsLiked,
		}
	}

	return result, nil
}

// calculatePostScore - Instagram/TikTok-style algorithm
func calculatePostScore(createdAt time.Time, likes, comments int, userInteractionScore float64) float64 {
	now := time.Now()
	ageInHours := now.Sub(createdAt).Hours()

	// Weighted engagement (comments worth 3x likes)
	engagementScore := float64(likes) + float64(comments)*3.0

	// Faster time decay (50% every 24 hours for Instagram-like freshness)
	timeDecay := math.Pow(0.5, ageInHours/24.0)

	// Strong recency boost for very new content (TikTok-style)
	recencyBoost := 1.0
	if ageInHours < 1 {
		recencyBoost = 5.0 // Very strong boost for <1 hour
	} else if ageInHours < 3 {
		recencyBoost = 3.0
	} else if ageInHours < 6 {
		recencyBoost = 2.0
	} else if ageInHours < 12 {
		recencyBoost = 1.5
	}

	// User affinity boost
	userBoost := 1.0 + userInteractionScore

	// Base score to keep zero-engagement posts visible
	baseScore := 1.0

	// Final score formula
	score := (baseScore + engagementScore) * timeDecay * recencyBoost * userBoost

	// Add diminishing recency component
	score += (5.0 / (1.0 + ageInHours/2.0))

	return score
}

// getUserInteractionScore calculates user's interaction preferences
// FIXED: PostgreSQL-compatible SQL queries
func getUserInteractionScore(userID uint) map[uint]float64 {
	if userID == 0 {
		return map[uint]float64{}
	}

	scores := make(map[uint]float64)

	// FIXED: Get authors user has liked (with recency tracking)
	// Use subquery to properly handle DISTINCT with ORDER BY
	type UserInteraction struct {
		UserID    uint
		CreatedAt time.Time
	}

	var likedInteractions []UserInteraction
	database.DB.Raw(`
		SELECT p.user_id, MAX(l.created_at) as created_at
		FROM likes l 
		JOIN posts p ON l.post_id = p.id 
		WHERE l.user_id = ? AND l.deleted_at IS NULL
		GROUP BY p.user_id
		ORDER BY created_at DESC
		LIMIT 30
	`, userID).Scan(&likedInteractions)

	for _, interaction := range likedInteractions {
		scores[interaction.UserID] = 0.4 // 40% boost
	}

	// FIXED: Get authors user has commented on (with recency tracking)
	var commentedInteractions []UserInteraction
	database.DB.Raw(`
		SELECT p.user_id, MAX(c.created_at) as created_at
		FROM comments c 
		JOIN posts p ON c.post_id = p.id 
		WHERE c.user_id = ?
		GROUP BY p.user_id
		ORDER BY created_at DESC
		LIMIT 20
	`, userID).Scan(&commentedInteractions)

	for _, interaction := range commentedInteractions {
		scores[interaction.UserID] += 0.3 // Additional 30% boost
	}

	return scores
}
