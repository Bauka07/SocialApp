// internal/routes/contact_routes.go
package routes

import (
	"github.com/Bauka07/SocialApp/internal/controllers"
	"github.com/Bauka07/SocialApp/internal/middleware"
	"github.com/gin-gonic/gin"
)

func ContactRoutes(r *gin.Engine) {
	// Public route - anyone can submit contact form (no authentication required)
	r.POST("/api/contact", controllers.HandleContact)

	// Protected admin routes - require JWT authentication
	admin := r.Group("/api/admin/contacts")
	admin.Use(middleware.AuthCheck()) // Your existing auth middleware
	{
		// GET /api/admin/contacts - List all messages (with optional ?status=unread filter)
		admin.GET("", controllers.GetAllContacts)

		// GET /api/admin/contacts/1 - View specific message (auto marks as read)
		admin.GET("/:id", controllers.GetContactByID)

		// PUT /api/admin/contacts/1/status - Update status to "read" or "replied"
		admin.PUT("/:id/status", controllers.UpdateContactStatus)

		// DELETE /api/admin/contacts/1 - Delete a message
		admin.DELETE("/:id", controllers.DeleteContact)
	}
}
