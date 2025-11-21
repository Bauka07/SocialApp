package routes

import (
	"github.com/Bauka07/SocialApp/internal/controllers"
	"github.com/Bauka07/SocialApp/internal/middleware"
	"github.com/gin-gonic/gin"
)

func ChatRoutes(r *gin.RouterGroup) {
	// WebSocket is handled in main.go at root level

	chats := r.Group("/chats")
	chats.Use(middleware.AuthCheck())
	{
		chats.GET("", controllers.GetChats)
		chats.DELETE("/:user_id", controllers.DeleteChat)
	}

	messages := r.Group("/messages")
	messages.Use(middleware.AuthCheck())
	{
		messages.GET("/:user_id", controllers.GetMessages)
		messages.PUT("/:message_id/read", controllers.MarkMessageAsRead)
		messages.PUT("/:message_id", controllers.EditMessage)
		messages.DELETE("/:message_id", controllers.DeleteMessage)
	}
}
