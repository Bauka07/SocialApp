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
	ReplyToID  *uint  `json:"reply_to_id,omitempty"` // Add this
}

func NewClient(hub *Hub, conn *websocket.Conn, userID uint) *Client {
	return &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		UserID: userID,
	}
}

// ReadPump pumps messages from the websocket connection to the hub
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

// handleTyping sends typing notification to receiver
func (c *Client) handleTyping(wsMsg WebSocketMessage) {
	response := map[string]interface{}{
		"type":    "typing",
		"user_id": c.UserID,
	}

	responseJSON, _ := json.Marshal(response)
	c.hub.SendToUser(wsMsg.ReceiverID, responseJSON)
}

// handleStopTyping sends stop typing notification to receiver
func (c *Client) handleStopTyping(wsMsg WebSocketMessage) {
	response := map[string]interface{}{
		"type":    "stop_typing",
		"user_id": c.UserID,
	}

	responseJSON, _ := json.Marshal(response)
	c.hub.SendToUser(wsMsg.ReceiverID, responseJSON)
}

// WritePump pumps messages from the hub to the websocket connection
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

			// Add queued messages to the current websocket message
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
	// Save message to database
	message := models.Message{
		Content:    wsMsg.Content,
		SenderID:   c.UserID,
		ReceiverID: wsMsg.ReceiverID,
		IsRead:     false,
		ReplyToID:  wsMsg.ReplyToID, // Add reply support
	}

	// If replying to a message, verify it exists and isn't deleted
	if wsMsg.ReplyToID != nil {
		var replyToMsg models.Message
		if err := database.DB.First(&replyToMsg, *wsMsg.ReplyToID).Error; err != nil {
			log.Printf("Error finding reply message: %v", err)
			return
		}

		// Check if message is deleted for either user
		if (replyToMsg.SenderID == c.UserID && replyToMsg.DeletedForSender) ||
			(replyToMsg.ReceiverID == c.UserID && replyToMsg.DeletedForReceiver) {
			log.Printf("Cannot reply to deleted message")
			return
		}

		// Verify the reply message is part of this conversation
		if !((replyToMsg.SenderID == c.UserID && replyToMsg.ReceiverID == wsMsg.ReceiverID) ||
			(replyToMsg.SenderID == wsMsg.ReceiverID && replyToMsg.ReceiverID == c.UserID)) {
			log.Printf("Reply message not part of conversation")
			return
		}
	}

	if err := database.DB.Create(&message).Error; err != nil {
		log.Printf("Error saving message: %v", err)
		return
	}

	// Load relations (including reply_to)
	database.DB.Preload("Sender").Preload("Receiver").Preload("ReplyTo").First(&message, message.ID)

	// Prepare response
	response := map[string]interface{}{
		"type":    "new_message",
		"message": message,
	}

	responseJSON, err := json.Marshal(response)
	if err != nil {
		log.Printf("Error marshaling response: %v", err)
		return
	}

	// Send to sender (confirmation)
	c.send <- responseJSON

	// Send to receiver if online
	c.hub.SendToUser(wsMsg.ReceiverID, responseJSON)
}
