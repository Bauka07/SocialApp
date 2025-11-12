package websocket

import (
	"encoding/json"
	"log"
	"sync"
)

type Hub struct {
	// Registered clients (userID -> Client)
	clients map[uint]*Client

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Broadcast messages to all clients
	broadcast chan []byte

	// Mutex for thread-safe operations
	mu sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[uint]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.UserID] = client
			h.mu.Unlock()
			log.Printf("✅ Client registered: UserID %d", client.UserID)

			// Notify all clients that user is online
			h.NotifyUserStatus(client.UserID, true)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.UserID]; ok {
				delete(h.clients, client.UserID)
				close(client.send)
			}
			h.mu.Unlock()
			log.Printf("❌ Client unregistered: UserID %d", client.UserID)

			// Notify all clients that user is offline
			h.NotifyUserStatus(client.UserID, false)

		case message := <-h.broadcast:
			h.mu.RLock()
			for _, client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client.UserID)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// SendToUser sends a message to a specific user
func (h *Hub) SendToUser(userID uint, message []byte) {
	h.mu.RLock()
	client, ok := h.clients[userID]
	h.mu.RUnlock()

	if ok {
		select {
		case client.send <- message:
			log.Printf("✅ Message sent to user %d", userID)
		default:
			log.Printf("❌ Failed to send message to user %d (channel full)", userID)
		}
	} else {
		log.Printf("⚠️ User %d is offline, message not sent", userID)
	}
}

// IsUserOnline checks if a user is currently connected
func (h *Hub) IsUserOnline(userID uint) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	_, ok := h.clients[userID]
	return ok
}

// NotifyUserStatus notifies all clients about a user's online status
func (h *Hub) NotifyUserStatus(userID uint, online bool) {
	message := map[string]interface{}{
		"type":    "user_status",
		"user_id": userID,
		"online":  online,
	}

	h.BroadcastJSON(message)
}

// BroadcastJSON broadcasts a JSON message to all connected clients
func (h *Hub) BroadcastJSON(data interface{}) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Printf("❌ Error marshaling broadcast data: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for userID, client := range h.clients {
		select {
		case client.send <- jsonData:
			// Message sent successfully
		default:
			log.Printf("⚠️ Failed to broadcast to user %d (channel full)", userID)
		}
	}
}

// Register adds a client to the hub
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister removes a client from the hub
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}
