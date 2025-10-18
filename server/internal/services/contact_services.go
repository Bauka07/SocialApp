// internal/services/email_service.go
package services

import (
	"fmt"
	"net/smtp"
	"os"

	"github.com/Bauka07/SocialApp/internal/models"
)

// SendContactNotification sends email when someone submits contact form
// NOTE: This is OPTIONAL - only use if you want email notifications
func SendContactNotification(contact models.Contact) error {
	// Email configuration from environment variables
	from := os.Getenv("SMTP_FROM")         // e.g., "noreply@yourapp.com"
	password := os.Getenv("SMTP_PASSWORD") // Your app password
	to := os.Getenv("ADMIN_EMAIL")         // Your email to receive notifications
	smtpHost := os.Getenv("SMTP_HOST")     // e.g., "smtp.gmail.com"
	smtpPort := os.Getenv("SMTP_PORT")     // e.g., "587"

	// Check if email is configured
	if from == "" || password == "" || to == "" {
		return fmt.Errorf("email not configured - set SMTP environment variables")
	}

	// Compose email subject and body
	subject := fmt.Sprintf("New Contact Form Message from %s", contact.Name)
	body := fmt.Sprintf(`
New Contact Form Submission
----------------------------
Name: %s
Email: %s
Message: %s
Time: %s

Reply to: %s
	`, contact.Name, contact.Email, contact.Message, contact.CreatedAt.Format("2006-01-02 15:04:05"), contact.Email)

	// Create email message
	message := []byte(fmt.Sprintf("Subject: %s\r\n\r\n%s", subject, body))

	// SMTP authentication
	auth := smtp.PlainAuth("", from, password, smtpHost)

	// Send email
	err := smtp.SendMail(
		smtpHost+":"+smtpPort,
		auth,
		from,
		[]string{to},
		message,
	)

	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}
