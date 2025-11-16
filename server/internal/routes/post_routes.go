package routes

import (
	"github.com/Bauka07/SocialApp/internal/controllers"
	"github.com/Bauka07/SocialApp/internal/middleware"
	"github.com/gin-gonic/gin"
)

func PostRoutes(r *gin.Engine) {
	posts := r.Group("/posts")
	{

		// Feed endpoints (specific routes first)
		posts.GET("", middleware.OptionalAuth(), controllers.GetSmartFeed)
		posts.GET("/trending", middleware.OptionalAuth(), controllers.GetTrendingPosts)
		posts.GET("/my-posts", middleware.AuthCheck(), controllers.GetMyPosts)

		// Like-related specific routes
		posts.GET("/liked/my-likes", middleware.AuthCheck(), controllers.GetUserLikedPosts)

		// Post CRUD operations (require auth)
		posts.POST("", middleware.AuthCheck(), controllers.CreatePost)

		// Wildcard routes MUST come LAST
		posts.GET("/:id", controllers.GetPostByID)
		posts.PUT("/:id", middleware.AuthCheck(), controllers.UpdatePost)
		posts.DELETE("/:id", middleware.AuthCheck(), controllers.DeletePost)
		posts.POST("/:id/upload-image", middleware.AuthCheck(), controllers.UploadPostImage)

		// Post interactions (wildcard routes)
		posts.POST("/:id/like", middleware.AuthCheck(), controllers.ToggleLike)
		posts.GET("/:id/likes", middleware.AuthCheck(), controllers.GetPostLikes)
		posts.POST("/:id/comments", middleware.AuthCheck(), controllers.CreateComment)
		posts.GET("/:id/comments", middleware.AuthCheck(), controllers.GetPostComments)
	}

	// Comment management
	comments := r.Group("/comments")
	{
		comments.PUT("/:id", middleware.AuthCheck(), controllers.UpdateComment)
		comments.DELETE("/:id", middleware.AuthCheck(), controllers.DeleteComment)
	}
}
