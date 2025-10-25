package routes

import (
	"github.com/Bauka07/SocialApp/internal/controllers"
	"github.com/Bauka07/SocialApp/internal/middleware"
	"github.com/gin-gonic/gin"
)

func PostRoutes(r *gin.Engine) {
	posts := r.Group("/posts")
	{
		// Protected routes (require authentication) - Put specific routes FIRST
		posts.GET("/my-posts", middleware.AuthCheck(), controllers.GetMyPosts)               // Get my posts
		posts.POST("", middleware.AuthCheck(), controllers.CreatePost)                       // Create post
		posts.PUT("/:id", middleware.AuthCheck(), controllers.UpdatePost)                    // Update post
		posts.DELETE("/:id", middleware.AuthCheck(), controllers.DeletePost)                 // Delete post
		posts.POST("/:id/upload-image", middleware.AuthCheck(), controllers.UploadPostImage) // Upload post image

		// Public routes - Put generic /:id route LAST to avoid conflicts
		posts.GET("/:id", controllers.GetPostByID) // Get single post
		posts.GET("/", controllers.GetPosts)
	}
}
