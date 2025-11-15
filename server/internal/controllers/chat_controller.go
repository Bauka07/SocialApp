package controllers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/Bauka07/SocialApp/internal/config"
	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
	ws "github.com/Bauka07/SocialApp/internal/websocket"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var Hub = ws.NewHub()

func init() {
	go Hub.Run()
}

func WebSocketHandler(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		log.Println("❌ WebSocket: No token provided")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token required"})
		return
	}

	log.Printf("🔑 WebSocket: Validating token: %s...", token[:min(20, len(token))])

	userID, err := validateTokenAndGetUserID(token)
	if err != nil {
		log.Printf("❌ WebSocket: Token validation failed: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token: " + err.Error()})
		return
	}

	log.Printf("✅ WebSocket: Token valid for user ID: %d", userID)

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("❌ WebSocket: Upgrade error: %v", err)
		return
	}

	log.Printf("✅ WebSocket: Connection upgraded for user %d", userID)

	client := ws.NewClient(Hub, conn, userID)
	Hub.Register(client)

	log.Printf("✅ WebSocket: Client registered for user %d", userID)

	go client.WritePump()
	go client.ReadPump()
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func getUserIDFromContext(c *gin.Context) (uint, error) {
	userIDInterface, exists := c.Get("userID")
	if !exists {
		return 0, errors.New("user ID not found in context")
	}

	switch v := userIDInterface.(type) {
	case string:
		if id, err := strconv.ParseUint(v, 10, 32); err == nil {
			return uint(id), nil
		}
		return 0, errors.New("invalid user ID format")
	case uint:
		return v, nil
	case int:
		return uint(v), nil
	default:
		return 0, errors.New("invalid user ID type")
	}
}

// FIXED: GetChats now filters out chats where all messages are deleted for current user
func GetChats(c *gin.Context) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var messages []models.Message
	if err := database.DB.
		Preload("ReplyTo").
		Where("sender_id = ? OR receiver_id = ?", userID, userID).
		Order("created_at DESC").
		Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch chats"})
		return
	}

	chatsMap := make(map[uint]*ChatResponse)

	for _, msg := range messages {
		if msg.SenderID == userID && msg.DeletedForSender {
			continue
		}
		if msg.ReceiverID == userID && msg.DeletedForReceiver {
			continue
		}

		var partnerID uint
		if msg.SenderID == userID {
			partnerID = msg.ReceiverID
		} else {
			partnerID = msg.SenderID
		}

		if chat, exists := chatsMap[partnerID]; exists {
			if !msg.IsRead && msg.ReceiverID == userID {
				chat.UnreadCount++
			}
			continue
		}

		var partner models.User
		if err := database.DB.Select("id, username, email, image_url").
			First(&partner, partnerID).Error; err != nil {
			continue
		}

		isOnline := Hub.IsUserOnline(partnerID)

		unreadCount := int64(0)
		if msg.ReceiverID == userID && !msg.IsRead {
			unreadCount = 1
		}
		database.DB.Model(&models.Message{}).
			Where("receiver_id = ? AND sender_id = ? AND is_read = ? AND deleted_for_receiver = ?",
				userID, partnerID, false, false).
			Count(&unreadCount)

		chatsMap[partnerID] = &ChatResponse{
			User: UserResponse{
				ID:       partner.ID,
				Username: partner.Username,
				Email:    partner.Email,
				Avatar:   partner.ImageURL,
				Online:   isOnline,
			},
			LastMessage: &msg,
			UnreadCount: int(unreadCount),
		}
	}

	chats := make([]ChatResponse, 0, len(chatsMap))
	for _, chat := range chatsMap {
		chats = append(chats, *chat)
	}

	c.JSON(http.StatusOK, chats)
}

func MarkMessageAsRead(c *gin.Context) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	messageIDStr := c.Param("message_id")
	messageID, err := strconv.ParseUint(messageIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	var message models.Message
	if err := database.DB.First(&message, messageID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		return
	}

	if message.ReceiverID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized"})
		return
	}

	message.IsRead = true
	if err := database.DB.Save(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Message marked as read"})
}

func SearchUsers(c *gin.Context) {
	query := c.Query("username")
	if len(query) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query must be at least 2 characters"})
		return
	}

	currentUserID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var users []models.User
	if err := database.DB.Select("id, username, email, image_url").
		Where("username LIKE ? AND id != ?", "%"+query+"%", currentUserID).
		Limit(20).
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}

	c.JSON(http.StatusOK, users)
}

type ChatResponse struct {
	User        UserResponse    `json:"user"`
	LastMessage *models.Message `json:"last_message,omitempty"`
	UnreadCount int             `json:"unread_count"`
}

type UserResponse struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Avatar   string `json:"avatar,omitempty"`
	Online   bool   `json:"online"`
}

func validateTokenAndGetUserID(tokenString string) (uint, error) {
	log.Printf("🔍 Validating token...")

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			log.Printf("❌ Invalid signing method: %v", token.Method)
			return nil, errors.New("invalid signing method")
		}
		log.Printf("✅ Signing method valid")
		return []byte(config.JWTSecret), nil
	})

	if err != nil {
		log.Printf("❌ Token parse error: %v", err)
		return 0, err
	}

	log.Printf("✅ Token parsed successfully")

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		log.Printf("✅ Token is valid, extracting claims...")

		if exp, ok := claims["exp"].(float64); ok {
			expTime := time.Unix(int64(exp), 0)
			now := time.Now()
			log.Printf("Token expiration: %v (now: %v)", expTime, now)

			if now.After(expTime) {
				log.Printf("❌ Token expired")
				return 0, errors.New("token expired")
			}
			log.Printf("✅ Token not expired")
		} else {
			log.Printf("⚠️ No expiration claim found")
		}

		if userIDStr, ok := claims["userID"].(string); ok {
			if id, err := strconv.ParseUint(userIDStr, 10, 32); err == nil {
				log.Printf("✅ User ID extracted from 'userID' (string): %d", uint(id))
				return uint(id), nil
			}
		}

		if userIDFloat, ok := claims["userID"].(float64); ok {
			log.Printf("✅ User ID extracted from 'userID' (float): %d", uint(userIDFloat))
			return uint(userIDFloat), nil
		}

		if userIDFloat, ok := claims["user_id"].(float64); ok {
			log.Printf("✅ User ID extracted from 'user_id' (float): %d", uint(userIDFloat))
			return uint(userIDFloat), nil
		}

		log.Printf("❌ userID/user_id claim not found or invalid type. Claims: %+v", claims)
	} else {
		log.Printf("❌ Token invalid or claims extraction failed")
	}

	return 0, errors.New("invalid token claims")
}

func GetMessages(c *gin.Context) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	otherUserIDStr := c.Param("user_id")
	otherUserID, err := strconv.ParseUint(otherUserIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var otherUser models.User
	if err := database.DB.First(&otherUser, otherUserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var messages []models.Message
	if err := database.DB.Preload("ReplyTo").
		Where(
			"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
			userID, otherUserID, otherUserID, userID,
		).Order("created_at ASC").Find(&messages).Error; err != nil {
		log.Printf("Error fetching messages: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	filteredMessages := []models.Message{}
	for _, msg := range messages {
		if msg.SenderID == userID && msg.DeletedForSender {
			continue
		}
		if msg.ReceiverID == userID && msg.DeletedForReceiver {
			continue
		}
		filteredMessages = append(filteredMessages, msg)
	}

	if filteredMessages == nil {
		filteredMessages = []models.Message{}
	}

	database.DB.Model(&models.Message{}).
		Where("sender_id = ? AND receiver_id = ? AND is_read = ?", otherUserID, userID, false).
		Update("is_read", true)

	c.JSON(http.StatusOK, filteredMessages)
}

func EditMessage(c *gin.Context) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	messageIDStr := c.Param("message_id")
	messageID, err := strconv.ParseUint(messageIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Content is required"})
		return
	}

	var message models.Message
	if err := database.DB.First(&message, messageID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		return
	}

	if message.SenderID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only edit your own messages"})
		return
	}

	message.Content = req.Content
	if err := database.DB.Save(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update message"})
		return
	}

	notification := map[string]interface{}{
		"type":    "message_edited",
		"message": message,
	}
	notificationJSON, err := json.Marshal(notification)
	if err != nil {
		log.Printf("Error marshaling notification: %v", err)
	}

	Hub.SendToUser(message.SenderID, notificationJSON)
	Hub.SendToUser(message.ReceiverID, notificationJSON)

	c.JSON(http.StatusOK, message)
}

func DeleteMessage(c *gin.Context) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	messageIDStr := c.Param("message_id")
	messageID, err := strconv.ParseUint(messageIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	var req struct {
		DeleteFor string `json:"delete_for"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var message models.Message
	if err := database.DB.First(&message, messageID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		return
	}

	if message.SenderID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own messages"})
		return
	}

	if req.DeleteFor == "all" {
		message.DeletedForSender = true
		message.DeletedForReceiver = true

		if err := database.DB.Save(&message).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete message"})
			return
		}

		notification := map[string]interface{}{
			"type":       "message_deleted",
			"message_id": message.ID,
		}
		notificationJSON, err := json.Marshal(notification)
		if err != nil {
			log.Printf("Error marshaling notification: %v", err)
		} else {
			Hub.SendToUser(message.SenderID, notificationJSON)
			Hub.SendToUser(message.ReceiverID, notificationJSON)
		}
	} else {
		message.DeletedForSender = true

		if err := database.DB.Save(&message).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete message"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Message deleted successfully"})
}

// FIXED: DeleteChat now properly handles deletion and prevents infinite loops
func DeleteChat(c *gin.Context) {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	otherUserIDStr := c.Param("user_id")
	otherUserID, err := strconv.ParseUint(otherUserIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		DeleteFor string `json:"delete_for"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// FIXED: Use proper bulk update instead of loop
	if req.DeleteFor == "all" {
		// Delete for both users
		database.DB.Model(&models.Message{}).
			Where("(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
				userID, otherUserID, otherUserID, userID).
			Updates(map[string]interface{}{
				"deleted_for_sender":   true,
				"deleted_for_receiver": true,
			})

		// Notify other user
		notification := map[string]interface{}{
			"type":          "chat_deleted",
			"other_user_id": userID,
		}
		notificationJSON, _ := json.Marshal(notification)
		Hub.SendToUser(uint(otherUserID), notificationJSON)
	} else {
		// Delete only for current user
		// Update messages where user is sender
		database.DB.Model(&models.Message{}).
			Where("sender_id = ? AND receiver_id = ?", userID, otherUserID).
			Update("deleted_for_sender", true)

		// Update messages where user is receiver
		database.DB.Model(&models.Message{}).
			Where("sender_id = ? AND receiver_id = ?", otherUserID, userID).
			Update("deleted_for_receiver", true)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Chat deleted successfully"})
}
