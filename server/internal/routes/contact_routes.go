// internal/routes/contact_routes.go
package routes

import (
	"github.com/Bauka07/SocialApp/internal/controllers"
	"github.com/gin-gonic/gin"
)

func ContactRoutes(r *gin.Engine) {
	api := r.Group("/api")
	api.POST("/contact", controllers.ContactHandler)
}
