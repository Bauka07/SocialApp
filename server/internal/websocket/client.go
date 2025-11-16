package websocket

import (
	"encoding/json"
	"log"
	"time"

	"github.com/Bauka07/SocialApp/internal/database"
	"github.com/Bauka07/SocialApp/internal/models"
	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024 // 512 KB
)

type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	UserID uint
}

type WebSocketMessage struct {
	Type       string `json:"type"`
	ReceiverID uint   `json:"receiver_id"`
	Content    string `json:"content"`
	ReplyToID  *uint  `json:"reply_to_id,omitempty"`
}

func NewClient(hub *Hub, conn *websocket.Conn, userID uint) *Client {
	return &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		UserID: userID,
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var wsMsg WebSocketMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			log.Printf("Error unmarshaling message: %v", err)
			continue
		}

		switch wsMsg.Type {
		case "send_message":
			c.handleSendMessage(wsMsg)
		case "typing":
			c.handleTyping(wsMsg)
		case "stop_typing":
			c.handleStopTyping(wsMsg)
		default:
			log.Printf("Unknown message type: %s", wsMsg.Type)
		}
	}
}

func (c *Client) handleTyping(wsMsg WebSocketMessage) {
	response := map[string]interface{}{
		"type":    "typing",
		"user_id": c.UserID,
	}

	responseJSON, _ := json.Marshal(response)
	c.hub.SendToUser(wsMsg.ReceiverID, responseJSON)
}

func (c *Client) handleStopTyping(wsMsg WebSocketMessage) {
	response := map[string]interface{}{
		"type":    "stop_typing",
		"user_id": c.UserID,
	}

	responseJSON, _ := json.Marshal(response)
	c.hub.SendToUser(wsMsg.ReceiverID, responseJSON)
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleSendMessage(wsMsg WebSocketMessage) {
	// FIXED: Add validation
	if wsMsg.Content == "" {
		log.Printf("❌ Empty message content from user %d", c.UserID)
		return
	}

	if wsMsg.ReceiverID == 0 {
		log.Printf("❌ Invalid receiver ID from user %d", c.UserID)
		return
	}

	// FIXED: Prevent sending messages to self
	if wsMsg.ReceiverID == c.UserID {
		log.Printf("❌ User %d tried to send message to themselves", c.UserID)
		return
	}

	message := models.Message{
		Content:    wsMsg.Content,
		SenderID:   c.UserID,
		ReceiverID: wsMsg.ReceiverID,
		IsRead:     false,
		ReplyToID:  wsMsg.ReplyToID,
	}

	// If replying to a message, verify it exists and isn't deleted
	if wsMsg.ReplyToID != nil {
		var replyToMsg models.Message
		if err := database.DB.First(&replyToMsg, *wsMsg.ReplyToID).Error; err != nil {
			log.Printf("❌ Error finding reply message: %v", err)
			return
		}

		// Check if message is deleted for either user
		if (replyToMsg.SenderID == c.UserID && replyToMsg.DeletedForSender) ||
			(replyToMsg.ReceiverID == c.UserID && replyToMsg.DeletedForReceiver) {
			log.Printf("❌ Cannot reply to deleted message")
			return
		}

		// Verify the reply message is part of this conversation
		if !((replyToMsg.SenderID == c.UserID && replyToMsg.ReceiverID == wsMsg.ReceiverID) ||
			(replyToMsg.SenderID == wsMsg.ReceiverID && replyToMsg.ReceiverID == c.UserID)) {
			log.Printf("❌ Reply message not part of conversation")
			return
		}
	}

	// FIXED: Add transaction and better error handling
	tx := database.DB.Begin()
	if tx.Error != nil {
		log.Printf("❌ Error starting transaction: %v", tx.Error)
		return
	}

	if err := tx.Create(&message).Error; err != nil {
		tx.Rollback()
		log.Printf("❌ Error saving message: %v", err)

		// Send error to sender
		errorResponse := map[string]interface{}{
			"type":  "error",
			"error": "Failed to send message",
		}
		errorJSON, _ := json.Marshal(errorResponse)
		c.send <- errorJSON
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("❌ Error committing transaction: %v", err)
		return
	}

	// Load relations (including reply_to)
	database.DB.Preload("Sender").Preload("Receiver").Preload("ReplyTo").First(&message, message.ID)

	log.Printf("✅ Message saved: ID=%d, From=%d, To=%d", message.ID, message.SenderID, message.ReceiverID)

	// Prepare response
	response := map[string]interface{}{
		"type":    "new_message",
		"message": message,
	}

	responseJSON, err := json.Marshal(response)
	if err != nil {
		log.Printf("❌ Error marshaling response: %v", err)
		return
	}

	// Send to sender (confirmation)
	select {
	case c.send <- responseJSON:
		log.Printf("✅ Confirmation sent to sender %d", c.UserID)
	default:
		log.Printf("⚠️ Could not send confirmation to sender %d (channel full)", c.UserID)
	}

	// Send to receiver if online
	c.hub.SendToUser(wsMsg.ReceiverID, responseJSON)
}
