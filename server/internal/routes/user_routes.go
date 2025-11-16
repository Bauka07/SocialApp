package routes

import (
	"github.com/Bauka07/SocialApp/internal/controllers"
	"github.com/Bauka07/SocialApp/internal/middleware"
	"github.com/gin-gonic/gin"
)

func UserRoutes(r *gin.Engine) {
	users := r.Group("/users")
	{
		users.POST("/register", controllers.RegisterWithRecaptcha)
		users.POST("/login", controllers.LoginWithRecaptcha)
		users.GET("/me", middleware.AuthCheck(), controllers.GetMyProfile)
		users.PUT("/update", middleware.AuthCheck(), controllers.UpdateProfile)
		users.PUT("/password", middleware.AuthCheck(), controllers.UpdatePassword)
		users.POST("/upload-image", middleware.AuthCheck(), controllers.UploadProfileImage)
	}

	// OAuth routes
	auth := r.Group("/auth")
	{
		// Server-side OAuth flow (currently unused but kept for future)
		auth.GET("/google", controllers.GoogleLogin)
		auth.GET("/google/callback", controllers.GoogleCallback)

		// Client-side OAuth flow
		auth.POST("/google/login", controllers.GoogleLoginClient)
		auth.POST("/google/register", controllers.GoogleRegisterClient)
	}
}
