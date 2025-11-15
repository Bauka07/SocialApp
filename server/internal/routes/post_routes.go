package routes

import (
	"github.com/Bauka07/SocialApp/internal/controllers"
	"github.com/Bauka07/SocialApp/internal/middleware"
	"github.com/gin-gonic/gin"
)

func PostRoutes(r *gin.Engine) {
	posts := r.Group("/posts")
	{
		// Public routes
		posts.GET("", middleware.AuthCheck(), controllers.GetPosts) // Get all posts
		posts.GET("/:id", controllers.GetPostByID)                  // Get single post

		// Protected routes - Posts
		posts.GET("/my-posts", middleware.AuthCheck(), controllers.GetMyPosts)
		posts.POST("", middleware.AuthCheck(), controllers.CreatePost)
		posts.PUT("/:id", middleware.AuthCheck(), controllers.UpdatePost)
		posts.DELETE("/:id", middleware.AuthCheck(), controllers.DeletePost)
		posts.POST("/:id/upload-image", middleware.AuthCheck(), controllers.UploadPostImage)

		// Protected routes - Likes
		posts.POST("/:id/like", middleware.AuthCheck(), controllers.ToggleLike)
		posts.GET("/:id/likes", middleware.AuthCheck(), controllers.GetPostLikes)
		posts.GET("/liked/my-likes", middleware.AuthCheck(), controllers.GetUserLikedPosts)

		// Protected routes - Comments
		posts.POST("/:id/comments", middleware.AuthCheck(), controllers.CreateComment)
		posts.GET("/:id/comments", middleware.AuthCheck(), controllers.GetPostComments)
	}

	// Comment deletion route
	comments := r.Group("/comments")
	{
		comments.DELETE("/:id", middleware.AuthCheck(), controllers.DeleteComment)
		comments.PUT("/:id", middleware.AuthCheck(), controllers.UpdateComment)
	}
}
