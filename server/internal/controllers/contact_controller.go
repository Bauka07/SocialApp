// internal/controllers/contact_controller.go
package controllers

import (
	"log"
	"net/http"

	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/Bauka07/SocialApp/internal/services"
	"github.com/gin-gonic/gin"
)

func ContactHandler(c *gin.Context) {
	var contact models.Contact

	if err := c.ShouldBindJSON(&contact); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if len(contact.Message) < 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message must be at least 4 characters"})
		return
	}

	if err := services.HandleContact(&contact); err != nil {
		log.Println("❌ Email send error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Message sent successfully!"})
}
