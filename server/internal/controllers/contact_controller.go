// internal/controllers/contact_controller.go
package controllers

import (
	"net/http"

	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/gin-gonic/gin"
)

type ContactRequest struct {
	Name    string `json:"name" binding:"required"`
	Email   string `json:"email" binding:"required,email"`
	Message string `json:"message" binding:"required,min=10"`
}

// HandleContact - Public endpoint to receive contact form submissions
func HandleContact(c *gin.Context) {
	var req ContactRequest

	// Validate request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create contact record
	contact := models.Contact{
		Name:    req.Name,
		Email:   req.Email,
		Message: req.Message,
		Status:  "unread",
	}

	// Save to database
	if err := database.DB.Create(&contact).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save message"})
		return
	}

	// Send email notification in background (optional - comment out if not using email)
	// go func() {
	// 	if err := services.SendContactNotification(contact); err != nil {
	// 		println("Failed to send email notification:", err.Error())
	// 	}
	// }()

	c.JSON(http.StatusOK, gin.H{
		"message": "Thank you for contacting us! We'll get back to you soon.",
		"id":      contact.ID,
	})
}

// GetAllContacts - Admin endpoint to view all messages
func GetAllContacts(c *gin.Context) {
	var contacts []models.Contact

	// Get query params for filtering
	status := c.Query("status") // ?status=unread

	query := database.DB.Order("created_at DESC")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&contacts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"contacts": contacts,
		"total":    len(contacts),
	})
}

// GetContactByID - Admin endpoint to view specific message
func GetContactByID(c *gin.Context) {
	id := c.Param("id")
	var contact models.Contact

	if err := database.DB.First(&contact, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		return
	}

	// Mark as read when viewed
	database.DB.Model(&contact).Update("status", "read")

	c.JSON(http.StatusOK, gin.H{"contact": contact})
}

// UpdateContactStatus - Admin endpoint to mark as read/replied
func UpdateContactStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status string `json:"status" binding:"required,oneof=read replied"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&models.Contact{}).Where("id = ?", id).Update("status", req.Status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}

// DeleteContact - Admin endpoint to delete a message
func DeleteContact(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Delete(&models.Contact{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Message deleted successfully"})
}
