package routes

import (
	"github.com/Bauka07/SocialApp/internal/controllers"
	"github.com/gin-gonic/gin"
)

// SetupPasswordResetRoutes configures password reset endpoints
func SetupPasswordResetRoutes(router *gin.Engine) {
	auth := router.Group("/auth")
	{
		auth.POST("/forgot-password", controllers.ForgotPassword)
		auth.POST("/verify-reset-code", controllers.VerifyResetCode)
		auth.POST("/reset-password", controllers.ResetPassword)
	}
	router.GET("/test-email", controllers.TestEmail)
}
