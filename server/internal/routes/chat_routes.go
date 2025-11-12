package routes

import (
	"github.com/Bauka07/SocialApp/internal/controllers"
	"github.com/Bauka07/SocialApp/internal/middleware"
	"github.com/gin-gonic/gin"
)

func ChatRoutes(r *gin.Engine) {
	r.GET("/ws", controllers.WebSocketHandler)

	api := r.Group("/api")
	api.Use(middleware.AuthCheck())
	{
		api.GET("/chats", controllers.GetChats)
		api.GET("/messages/:user_id", controllers.GetMessages)
		api.PUT("/messages/:message_id/read", controllers.MarkMessageAsRead)
		api.GET("/users/search", controllers.SearchUsers)
		api.GET("/user/me", controllers.GetMyProfile)

		// Message management (owner only)
		api.PUT("/messages/:message_id", controllers.EditMessage)
		api.DELETE("/messages/:message_id", controllers.DeleteMessage)

		// Chat management
		api.DELETE("/chats/:user_id", controllers.DeleteChat)
	}
}
