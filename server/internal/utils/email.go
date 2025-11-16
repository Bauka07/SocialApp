package utils

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"

	"gopkg.in/gomail.v2"
)

// SendPasswordResetEmail sends password reset via Gmail SMTP
func SendPasswordResetEmail(to string, username string, code string) error {
	log.Printf("📧 Preparing to send email to: %s", to)

	// Get SMTP credentials from environment
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPortStr := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASSWORD")

	// Validate environment variables
	if smtpHost == "" {
		return fmt.Errorf("SMTP_HOST not set in environment")
	}
	if smtpUser == "" {
		return fmt.Errorf("SMTP_USER not set in environment")
	}
	if smtpPass == "" {
		return fmt.Errorf("SMTP_PASSWORD not set in environment")
	}

	// Parse SMTP port (default to 587 if not set or invalid)
	smtpPort := 587
	if smtpPortStr != "" {
		if port, err := strconv.Atoi(smtpPortStr); err == nil {
			smtpPort = port
		} else {
			log.Printf("⚠️ Invalid SMTP_PORT '%s', using default 587", smtpPortStr)
		}
	}

	log.Printf("📧 SMTP Config - Host: %s, Port: %d, User: %s", smtpHost, smtpPort, smtpUser)

	// HTML email body
	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Password Reset - SocialApp</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body { 
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			background: linear-gradient(135deg, #f97316 0%%, #fb923c 100%%);
			padding: 40px 20px;
			line-height: 1.6;
		}
		.email-wrapper {
			max-width: 600px;
			margin: 0 auto;
			background: white;
			border-radius: 20px;
			overflow: hidden;
			box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		}
		.email-header {
			background: linear-gradient(135deg, #f97316 0%%, #fb923c 100%%);
			padding: 50px 40px;
			text-align: center;
		}
		.lock-icon {
			width: 80px;
			height: 80px;
			background: rgba(255, 255, 255, 0.25);
			border-radius: 50%%;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			font-size: 40px;
			margin-bottom: 20px;
			backdrop-filter: blur(10px);
			border: 3px solid rgba(255, 255, 255, 0.4);
		}
		.email-title {
			color: white;
			font-size: 32px;
			font-weight: 800;
			margin: 0;
			text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
		}
		.email-subtitle {
			color: rgba(255, 255, 255, 0.95);
			font-size: 16px;
			margin-top: 12px;
		}
		.email-body { padding: 50px 40px; }
		.greeting {
			font-size: 18px;
			color: #1f2937;
			margin-bottom: 24px;
			font-weight: 600;
		}
		.instruction-text {
			font-size: 15px;
			color: #4b5563;
			line-height: 1.8;
			margin-bottom: 32px;
		}
		.code-container {
			background: linear-gradient(135deg, #fef3c7 0%%, #fde68a 100%%);
			border: 3px dashed #f59e0b;
			border-radius: 16px;
			padding: 32px;
			text-align: center;
			margin: 32px 0;
		}
		.code-label {
			font-size: 13px;
			font-weight: 700;
			color: #92400e;
			text-transform: uppercase;
			letter-spacing: 1.5px;
			margin-bottom: 16px;
		}
		.code-value {
			font-size: 48px;
			font-weight: 900;
			color: #ea580c;
			letter-spacing: 12px;
			font-family: 'Courier New', monospace;
			text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
		}
		.expiry-notice {
			background: #fef2f2;
			border-left: 4px solid #ef4444;
			border-radius: 8px;
			padding: 16px 20px;
			margin: 24px 0;
			display: flex;
			align-items: center;
			gap: 12px;
		}
		.expiry-text {
			font-size: 14px;
			color: #991b1b;
			font-weight: 600;
		}
		.security-notice {
			background: #f0f9ff;
			border: 1px solid #bae6fd;
			border-radius: 12px;
			padding: 20px;
			margin-top: 32px;
		}
		.security-title {
			font-size: 14px;
			font-weight: 700;
			color: #0369a1;
			margin-bottom: 8px;
		}
		.security-text {
			font-size: 13px;
			color: #075985;
			line-height: 1.6;
		}
		.email-footer {
			background: #18181b;
			padding: 40px;
			text-align: center;
		}
		.footer-brand {
			color: white;
			font-size: 24px;
			font-weight: 800;
			margin-bottom: 12px;
		}
		.footer-text {
			color: #71717a;
			font-size: 12px;
		}
	</style>
</head>
<body>
	<div class="email-wrapper">
		<div class="email-header">
			<div class="lock-icon">🔐</div>
			<h1 class="email-title">Password Reset</h1>
			<p class="email-subtitle">Secure your account with a new password</p>
		</div>
		<div class="email-body">
			<div class="greeting">Hello %s! 👋</div>
			<p class="instruction-text">
				We received a request to reset your password. Use the verification code below to proceed.
			</p>
			<div class="code-container">
				<div class="code-label">🔑 Your Verification Code</div>
				<div class="code-value">%s</div>
			</div>
			<div class="expiry-notice">
				<span class="expiry-text">⏱️ This code will expire in 15 minutes</span>
			</div>
			<div class="security-notice">
				<div class="security-title">🛡️ Security Notice</div>
				<div class="security-text">
					If you didn't request a password reset, please ignore this email or contact our support team.
				</div>
			</div>
		</div>
		<div class="email-footer">
			<div class="footer-brand">SocialApp</div>
			<p class="footer-text">
				© 2025 SocialApp. All rights reserved.<br>
				This is an automated security email. Please do not reply.
			</p>
		</div>
	</div>
</body>
</html>
	`, username, code)

	// Plain text fallback
	textBody := fmt.Sprintf(`
Hello %s,

You requested to reset your password. Use the verification code below:

Verification Code: %s

This code will expire in 15 minutes.

If you didn't request this, please ignore this email.

Best regards,
SocialApp Team
	`, username, code)

	// Create email message
	m := gomail.NewMessage()
	m.SetHeader("From", smtpUser)
	m.SetHeader("To", to)
	m.SetHeader("Subject", "🔐 Password Reset Code - SocialApp")
	m.SetBody("text/plain", textBody)
	m.AddAlternative("text/html", htmlBody)

	// Configure SMTP dialer with proper TLS settings
	d := gomail.NewDialer(smtpHost, smtpPort, smtpUser, smtpPass)

	// Gmail requires TLS
	d.TLSConfig = &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         smtpHost,
	}

	log.Printf("📧 Connecting to SMTP server...")

	// Send email
	if err := d.DialAndSend(m); err != nil {
		log.Printf("❌ SMTP Error Details:")
		log.Printf("   - Host: %s", smtpHost)
		log.Printf("   - Port: %d", smtpPort)
		log.Printf("   - User: %s", smtpUser)
		log.Printf("   - Error: %v", err)
		return fmt.Errorf("failed to send email via SMTP: %w", err)
	}

	log.Printf("✅ Password reset email sent successfully to: %s", to)
	return nil
}

// SendEmail via Mailtrap API - For contact form
func SendEmail(to string, subject string, body string) error {
	token := os.Getenv("MAILTRAP_TOKEN")
	if token == "" {
		return fmt.Errorf("missing MAILTRAP_TOKEN in environment variables")
	}

	htmlBody := fmt.Sprintf(`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>%s</title>
			<style>
				* { margin: 0; padding: 0; box-sizing: border-box; }
				body { 
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
					background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
					padding: 40px 20px;
					line-height: 1.6;
				}
				.email-wrapper {
					max-width: 600px;
					margin: 0 auto;
				}
				.email-header {
					background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
					padding: 40px 30px;
					text-align: center;
					border-radius: 16px 16px 0 0;
				}
				.logo {
					width: 60px;
					height: 60px;
					background: rgba(255, 255, 255, 0.2);
					border-radius: 50%%;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					font-size: 32px;
					margin-bottom: 15px;
					backdrop-filter: blur(10px);
					border: 2px solid rgba(255, 255, 255, 0.3);
				}
				.email-title {
					color: white;
					font-size: 24px;
					font-weight: 700;
					margin: 0;
					text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
				}
				.email-subtitle {
					color: rgba(255, 255, 255, 0.9);
					font-size: 14px;
					margin-top: 8px;
				}
				.email-body {
					background: white;
					padding: 40px 30px;
				}
				.info-card {
					background: linear-gradient(135deg, #f5f7fa 0%%, #c3cfe2 100%%);
					border-radius: 12px;
					padding: 20px;
					margin-bottom: 24px;
					border-left: 4px solid #667eea;
				}
				.info-label {
					font-size: 12px;
					font-weight: 600;
					color: #667eea;
					text-transform: uppercase;
					letter-spacing: 0.5px;
					margin-bottom: 6px;
				}
				.info-value {
					font-size: 16px;
					color: #1a202c;
					font-weight: 500;
				}
				.message-section {
					background: #f8fafc;
					border-radius: 12px;
					padding: 24px;
					margin-top: 24px;
					border: 1px solid #e2e8f0;
				}
				.message-label {
					font-size: 12px;
					font-weight: 600;
					color: #64748b;
					text-transform: uppercase;
					letter-spacing: 0.5px;
					margin-bottom: 12px;
				}
				.message-content {
					font-size: 15px;
					color: #334155;
					line-height: 1.7;
					white-space: pre-wrap;
					word-wrap: break-word;
				}
				.divider {
					height: 1px;
					background: linear-gradient(to right, transparent, #e2e8f0, transparent);
					margin: 30px 0;
				}
				.email-footer {
					background: #1e293b;
					padding: 30px;
					text-align: center;
					border-radius: 0 0 16px 16px;
				}
				.footer-brand {
					color: white;
					font-size: 18px;
					font-weight: 700;
					margin-bottom: 8px;
				}
				.footer-text {
					color: #94a3b8;
					font-size: 13px;
					margin: 0;
				}
				@media only screen and (max-width: 600px) {
					body { padding: 20px 10px; }
					.email-header { padding: 30px 20px; }
					.email-body { padding: 30px 20px; }
					.email-footer { padding: 25px 20px; }
				}
			</style>
		</head>
		<body>
			<div class="email-wrapper">
				<div class="email-header">
					<div class="logo">📬</div>
					<h1 class="email-title">New Message Received</h1>
					<p class="email-subtitle">You have a new contact form submission</p>
				</div>
				<div class="email-body">
					<div class="info-card">
						<div class="info-label">From</div>
						<div class="info-value">%s</div>
					</div>
					<div class="info-card">
						<div class="info-label">Subject</div>
						<div class="info-value">%s</div>
					</div>
					<div class="message-section">
						<div class="message-label">📝 Message</div>
						<div class="message-content">%s</div>
					</div>
				</div>
				<div class="email-footer">
					<div class="footer-brand">SocialApp</div>
					<p class="footer-text">Connecting people, one message at a time</p>
					<div class="divider" style="background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);"></div>
					<p class="footer-text" style="font-size: 11px;">
						This email was sent from your SocialApp contact form.<br>
						© 2025 SocialApp. All rights reserved.
					</p>
				</div>
			</div>
		</body>
		</html>
	`, subject, to, subject, body)

	payload := map[string]interface{}{
		"from": map[string]string{
			"email": "hello@demomailtrap.co",
			"name":  "SocialApp Contact",
		},
		"to": []map[string]string{
			{"email": to},
		},
		"subject": subject,
		"text":    body,
		"html":    htmlBody,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", "https://send.api.mailtrap.io/api/send", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer res.Body.Close()

	bodyBytes, _ := io.ReadAll(res.Body)
	if res.StatusCode != 200 && res.StatusCode != 202 {
		log.Printf("❌ Mailtrap error: %s\nResponse: %s\n", res.Status, string(bodyBytes))
		return fmt.Errorf("mailtrap API failed with status %s: %s", res.Status, string(bodyBytes))
	}

	log.Println("✅ Contact email sent successfully via Mailtrap!")
	return nil
}
