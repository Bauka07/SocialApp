package routes

import (
	"github.com/Bauka07/SocialApp/internal/controllers"
	"github.com/Bauka07/SocialApp/internal/middleware"
	"github.com/gin-gonic/gin"
)

func PostRoutes(r *gin.Engine) {
	posts := r.Group("/posts")
	{
		// Public routes FIRST
		posts.GET("", controllers.GetPosts)        // Get all posts ✅
		posts.GET("/:id", controllers.GetPostByID) // Get single post

		// Protected routes
		posts.GET("/my-posts", middleware.AuthCheck(), controllers.GetMyPosts)
		posts.POST("", middleware.AuthCheck(), controllers.CreatePost)
		posts.PUT("/:id", middleware.AuthCheck(), controllers.UpdatePost)
		posts.DELETE("/:id", middleware.AuthCheck(), controllers.DeletePost)
		posts.POST("/:id/upload-image", middleware.AuthCheck(), controllers.UploadPostImage)
	}
}
