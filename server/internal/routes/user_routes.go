package routes

import (
	"github.com/Bauka07/SocialApp/internal/controllers"
	"github.com/Bauka07/SocialApp/internal/middleware"
	"github.com/gin-gonic/gin"
)

func UserRoutes(r *gin.Engine) {
	users := r.Group("/users")
	{
		users.POST("/register", controllers.Register)
		users.POST("/login", controllers.Login)
		users.GET("/me", middleware.AuthCheck(), controllers.GetMyProfile)

		users.PUT("/update", middleware.AuthCheck(), controllers.UpdateProfile)
		users.PUT("/password", middleware.AuthCheck(), controllers.UpdatePassword)
		users.POST("/upload-image", middleware.AuthCheck(), controllers.UploadProfileImage)
	}
}
