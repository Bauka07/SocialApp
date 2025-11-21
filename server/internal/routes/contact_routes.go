package routes

import (
	"github.com/Bauka07/SocialApp/internal/controllers"
	"github.com/gin-gonic/gin"
)

func ContactRoutes(r *gin.RouterGroup) {
	r.POST("/contact", controllers.ContactHandler)
}
