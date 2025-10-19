// internal/services/email_service.go
package services

import (
	"fmt"

	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/Bauka07/SocialApp/internal/utils"
)

func HandleContact(contact *models.Contact) error {
	if err := database.DB.Create(contact).Error; err != nil {
		return fmt.Errorf("database error: %w", err)
	}

	to := "baykatv5@gmail.com"
	subject := "📩 New message from " + contact.Name
	body := fmt.Sprintf(
		"Name: %s\nEmail: %s\n\nMessage:\n%s",
		contact.Name, contact.Email, contact.Message,
	)

	return utils.SendEmail(to, subject, body)
}
