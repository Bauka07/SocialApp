package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

// SendEmail via Mailtrap API
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
				.footer-links {
					margin-top: 20px;
				}
				.footer-link {
					color: #94a3b8;
					text-decoration: none;
					font-size: 12px;
					margin: 0 10px;
					transition: color 0.3s;
				}
				.footer-link:hover {
					color: #667eea;
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
				<!-- Header -->
				<div class="email-header">
					<div class="logo">📬</div>
					<h1 class="email-title">New Message Received</h1>
					<p class="email-subtitle">You have a new contact form submission</p>
				</div>

				<!-- Body -->
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

				<!-- Footer -->
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

	jsonData, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", "https://send.api.mailtrap.io/api/send", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	bodyBytes, _ := io.ReadAll(res.Body)
	if res.StatusCode != 200 && res.StatusCode != 202 {
		log.Printf("❌ Mailtrap error: %s\nResponse: %s\n", res.Status, string(bodyBytes))
		return fmt.Errorf("mailtrap API failed: %s", res.Status)
	}

	log.Println("✅ Email sent successfully via Mailtrap (Advanced HTML design)!")
	return nil
}
