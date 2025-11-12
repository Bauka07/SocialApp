import React, { useState, useEffect, useRef } from "react";
import {
  FiSend,
  FiSearch,
  FiX,
  FiTrash2,
  FiEdit2,
  FiCornerUpLeft,
  FiCopy,
} from "react-icons/fi";

interface Message {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  created_at: string;
  is_read: boolean;
  deleted_for_sender?: boolean;
  deleted_for_receiver?: boolean;
  reply_to_id?: number;
  reply_to?: Message;
}

interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  image_url?: string;
  online?: boolean;
}

interface Chat {
  user: User;
  last_message?: Message;
  unread_count: number;
}

interface ContextMenu {
  x: number;
  y: number;
  messageId: number;
  isOwnMessage: boolean;
}

interface ChatContextMenu {
  x: number;
  y: number;
  chatUserId: number;
}

const BACKEND_HOST = "localhost";
const BACKEND_PORT = "8080";
const API_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}/api`;
const WS_URL = `ws://${BACKEND_HOST}:${BACKEND_PORT}/ws`;

const Chat: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [key: number]: boolean }>({});
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [chatContextMenu, setChatContextMenu] = useState<ChatContextMenu | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  const [showChatDeleteModal, setShowChatDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const selectedChatRef = useRef<Chat | null>(null);
  const isFetchingChatsRef = useRef(false); // FIXED: Prevent multiple simultaneous fetches

  const [sidebarWidth, setSidebarWidth] = useState(320); // default 320px
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    const minWidth = 220;
    const maxWidth = 500;
    const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
    setSidebarWidth(newWidth);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
        setChatContextMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("❌ No token found");
          alert("Please login first");
          return;
        }
        
        const response = await fetch(`${API_URL}/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const user = data.user || data;
          setCurrentUser(user);
        } else {
          if (response.status === 401) {
            alert("Session expired. Please login again.");
          }
        }
      } catch (error) {
        console.error("❌ Error fetching user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const websocket = new WebSocket(`${WS_URL}?token=${token}`);

    websocket.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "new_message") {
          const newMessage: Message = data.message;
          
          const isRelevant = newMessage.sender_id === currentUser.id || 
                            newMessage.receiver_id === currentUser.id;
          
          if (!isRelevant) {
            return;
          }
          
          const belongsToCurrentChat = selectedChatRef.current && (
            (newMessage.sender_id === currentUser.id && newMessage.receiver_id === selectedChatRef.current.user.id) ||
            (newMessage.sender_id === selectedChatRef.current.user.id && newMessage.receiver_id === currentUser.id)
          );
          
          if (belongsToCurrentChat) {
            setMessages((prev) => {
              if (prev.find(m => m.id === newMessage.id)) return prev;
              
              const optimisticIndex = prev.findIndex(
                m => m.id > 1000000000000 &&
                    m.content === newMessage.content && 
                    m.sender_id === newMessage.sender_id &&
                    m.receiver_id === newMessage.receiver_id
              );
              
              if (optimisticIndex !== -1) {
                const updated = [...prev];
                updated[optimisticIndex] = newMessage;
                return updated;
              }
              
              return [...prev, newMessage];
            });
            
            if (newMessage.receiver_id === currentUser.id) {
              markMessageAsRead(newMessage.id);
            }
          }
          
          // FIXED: Only fetch chats once per message
          fetchChats();
        } else if (data.type === "user_status") {
          setChats((prev) =>
            prev.map((chat) =>
              chat.user.id === data.user_id
                ? { ...chat, user: { ...chat.user, online: data.online } }
                : chat
            )
          );
          
          setSelectedChat(prev => prev && prev.user.id === data.user_id ? {
            ...prev,
            user: { ...prev.user, online: data.online }
          } : prev);
        } else if (data.type === "typing") {
          setTypingUsers(prev => ({
            ...prev,
            [data.user_id]: true
          }));
          
          setTimeout(() => {
            setTypingUsers(prev => ({
              ...prev,
              [data.user_id]: false
            }));
          }, 3000);
        } else if (data.type === "stop_typing") {
          setTypingUsers(prev => ({
            ...prev,
            [data.user_id]: false
          }));
        } else if (data.type === "message_deleted") {
          setMessages(prev => prev.filter(m => m.id !== data.message_id));
          fetchChats();
        } else if (data.type === "message_edited") {
          setMessages(prev => 
            prev.map(m => 
              m.id === data.message.id ? data.message : m
            )
          );
          fetchChats();
        } else if (data.type === "chat_deleted") {
          // FIXED: Handle chat deletion properly
          setChats(prev => prev.filter(c => c.user.id !== data.other_user_id));
          if (selectedChat?.user.id === data.other_user_id) {
            setSelectedChat(null);
            setMessages([]);
          }
          // Don't fetch chats here - it's already been deleted
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.onerror = (error) => {
      console.error("❌ WebSocket error", error);
    };

    websocket.onclose = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (currentUser) {
          setWs(null);
        }
      }, 3000);
    };

    setWs(websocket);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      websocket.close();
    };
  }, [currentUser]);

  // FIXED: Prevent multiple simultaneous chat fetches
  const fetchChats = async () => {
    if (isFetchingChatsRef.current) {
      console.log("⏳ Already fetching chats, skipping...");
      return;
    }

    isFetchingChatsRef.current = true;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch(`${API_URL}/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setChats(data || []);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      isFetchingChatsRef.current = false;
    }
  };

  const fetchMessages = async (userId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch(`${API_URL}/messages/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch(
        `${API_URL}/users/search?username=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = window.setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    if (currentUser) {
      fetchChats();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.user.id);
    } else {
      setMessages([]);
    }
  }, [selectedChat?.user.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const markMessageAsRead = async (messageId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      await fetch(`${API_URL}/messages/${messageId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleTyping = () => {
    if (!ws || !selectedChat) return;

    if (!isTyping) {
      setIsTyping(true);
      ws.send(JSON.stringify({
        type: "typing",
        receiver_id: selectedChat.user.id
      }));
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "stop_typing",
          receiver_id: selectedChat.user.id
        }));
      }
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (messageInput.trim() && selectedChat && ws && ws.readyState === WebSocket.OPEN && currentUser) {
      const messageContent = messageInput.trim();

      if (editingMessage) {
        const token = localStorage.getItem("token");
        try {
          const response = await fetch(`${API_URL}/messages/${editingMessage.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content: messageContent }),
          });

          if (response.ok) {
            setEditingMessage(null);
            setMessageInput("");
          }
        } catch (error) {
          console.error("Error editing message:", error);
        }
      } else {
        const messageData = {
          type: "send_message",
          receiver_id: selectedChat.user.id,
          content: messageContent,
          reply_to_id: replyingTo?.id || null,
        };

        const optimisticMessage: Message = {
          id: Date.now(),
          content: messageContent,
          sender_id: currentUser.id,
          receiver_id: selectedChat.user.id,
          created_at: new Date().toISOString(),
          is_read: false,
          reply_to_id: replyingTo?.id,
          reply_to: replyingTo || undefined,
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setMessageInput("");
        setIsTyping(false);
        setReplyingTo(null);

        ws.send(JSON.stringify({
          type: "stop_typing",
          receiver_id: selectedChat.user.id
        }));

        ws.send(JSON.stringify(messageData));
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUserSelect = (user: User) => {
    const existingChat = chats.find((chat) => chat.user.id === user.id);
    
    if (existingChat) {
      setSelectedChat(existingChat);
    } else {
      const newChat: Chat = {
        user,
        unread_count: 0,
      };
      setChats((prev) => [newChat, ...prev]);
      setSelectedChat(newChat);
    }
    
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

    const handleMessageRightClick = (e: React.MouseEvent, message: Message) => {
      e.preventDefault();

      const menuWidth = 200; // matches min-w-[200px]
      const menuHeight = 150; // approximate, adjust if needed
      const offset = 8; // small space between cursor and menu

      const clickX = e.clientX;
      const clickY = e.clientY;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Adjust position to prevent overflow
      let x = clickX + offset;
      let y = clickY + offset;

      if (x + menuWidth > windowWidth) x = windowWidth - menuWidth - offset;
      if (y + menuHeight > windowHeight) y = windowHeight - menuHeight - offset;

      setContextMenu({
        x,
        y,
        messageId: message.id,
        isOwnMessage: message.sender_id === currentUser?.id,
      });
    };


  const handleChatRightClick = (e: React.MouseEvent, userId: number) => {
    e.preventDefault();
    setChatContextMenu({
      x: e.clientX,
      y: e.clientY,
      chatUserId: userId
    });
  };

  const handleDeleteMessage = async (deleteFor: "me" | "all") => {
    if (!messageToDelete) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/messages/${messageToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ delete_for: deleteFor }),
      });

      if (response.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageToDelete));
        fetchChats();
      } else {
        alert("Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }

    setShowDeleteModal(false);
    setMessageToDelete(null);
  };

  // FIXED: Improved chat deletion handler
  const handleDeleteChat = async (deleteFor: "me" | "all") => {
    if (!chatToDelete) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/chats/${chatToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ delete_for: deleteFor }),
      });

      if (response.ok) {
        // FIXED: Update UI immediately without fetching
        if (selectedChat?.user.id === chatToDelete) {
          setSelectedChat(null);
          setMessages([]);
        }
        
        // Remove chat from list immediately
        setChats(prev => prev.filter(c => c.user.id !== chatToDelete));
        
        // Only fetch chats after a delay to get updated data
        setTimeout(() => {
          fetchChats();
        }, 500);
      } else {
        alert("Failed to delete chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat");
    }

    setShowChatDeleteModal(false);
    setChatToDelete(null);
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setMessageInput(message.content);
    setReplyingTo(null);
    setContextMenu(null);
  };

  const handleReplyMessage = (message: Message) => {
    if (!currentUser) return;
    
    const isDeleted = (message.sender_id === currentUser.id && message.deleted_for_sender) ||
                     (message.receiver_id === currentUser.id && message.deleted_for_receiver);
    
    if (isDeleted) {
      alert("Cannot reply to a deleted message");
      setContextMenu(null);
      return;
    }
    
    setReplyingTo(message);
    setEditingMessage(null);
    setContextMenu(null);
  };

  const handleCopyMessage = (message: Message) => {
    navigator.clipboard.writeText(message.content);
    setContextMenu(null);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getAvatarUrl = (user: User) => {
    return user.avatar || user.image_url || `https://ui-avatars.com/api/?name=${user.username}&background=f97316&color=fff`;
  };

  const displayedChats = showSearchResults ? [] : chats.filter((chat) =>
    chat.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isCurrentChatUserTyping = selectedChat ? typingUsers[selectedChat.user.id] : false;

  const visibleMessages = messages.filter(m => {
    if (!currentUser) return true;
    if (m.sender_id === currentUser.id && m.deleted_for_sender) return false;
    if (m.receiver_id === currentUser.id && m.deleted_for_receiver) return false;
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50 select-none">
      <div
        className="bg-white border-r border-gray-200 flex flex-col"
        style={{ width: sidebarWidth }}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showSearchResults ? (
            <div>
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Search Results
                </span>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={18} />
                </button>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No users found</p>
                </div>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <img
                      src={getAvatarUrl(user)}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        @{user.username}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {displayedChats.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No chats yet</p>
                  <p className="text-sm mt-2">Search for users to start chatting!</p>
                </div>
              ) : (
                displayedChats.map((chat) => (
                  <div
                    key={chat.user.id}
                    onClick={() => setSelectedChat(chat)}
                    onContextMenu={(e) => handleChatRightClick(e, chat.user.id)}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedChat?.user.id === chat.user.id ? "bg-orange-50" : ""
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={getAvatarUrl(chat.user)}
                        alt={chat.user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {chat.user.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-semibold text-gray-900 truncate">
                          @{chat.user.username}
                        </h3>
                        {chat.last_message && (
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(chat.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      {chat.last_message && (
                        <p className="text-sm text-gray-600 truncate">
                          {chat.last_message.content}
                        </p>
                      )}
                    </div>
                    {chat.unread_count > 0 && (
                      <span className="bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      <div
        onMouseDown={handleMouseDown}
        className={`w-1 cursor-col-resize transition ${
          isResizing ? "bg-orange-500 shadow-md" : "bg-gray-200 hover:bg-orange-400"
        }`}
      >
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={getAvatarUrl(selectedChat.user)}
                    alt={selectedChat.user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {selectedChat.user.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    @{selectedChat.user.username}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {isCurrentChatUserTyping ? (
                      <span className="text-orange-500 font-medium">typing...</span>
                    ) : selectedChat.user.online ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {visibleMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                visibleMessages.map((message) => {
                  const isOwn = message.sender_id === currentUser?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        onContextMenu={(e) => handleMessageRightClick(e, message)}
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg cursor-pointer hover:shadow-md transition ${
                          isOwn
                            ? "bg-orange-500 text-white"
                            : "bg-white text-gray-900 border border-gray-200"
                        }`}
                      >
                        {message.reply_to && (
                          <div className={`mb-2 pb-2 border-l-2 pl-2 text-xs ${
                            isOwn ? "border-orange-300" : "border-gray-300"
                          }`}>
                            <div className={`flex items-center gap-1 mb-1 ${
                              isOwn ? "text-orange-100" : "text-gray-500"
                            }`}>
                              <FiCornerUpLeft size={12} />
                              <span className="font-medium">Reply to</span>
                            </div>
                            <p className={`truncate ${
                              isOwn ? "text-orange-100" : "text-gray-600"
                            }`}>
                              {message.reply_to.content}
                            </p>
                          </div>
                        )}
                        
                        <p className="text-sm break-words">{message.content}</p>
                        <span
                          className={`text-xs mt-1 block ${
                            isOwn ? "text-orange-100" : "text-gray-500"
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t border-gray-200 p-4">
              {editingMessage && (
                <div className="mb-2 p-2 bg-orange-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <FiEdit2 size={16} />
                    <span>Editing message</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingMessage(null);
                      setMessageInput("");
                    }}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              )}
              {replyingTo && (
                <div className="mb-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <FiCornerUpLeft size={16} />
                    <div>
                      <span className="font-medium">Replying to:</span>
                      <p className="text-gray-600 truncate max-w-xs">{replyingTo.content}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />

                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSend size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <FiSend size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Select a chat to start messaging
              </h3>
              <p className="text-gray-500">
                Search for users or choose from your conversations
              </p>
            </div>
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000,
          }}
          className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px]"
        >
          {contextMenu.isOwnMessage && (
            <>
              <button
                onClick={() => {
                  const message = messages.find(m => m.id === contextMenu.messageId);
                  if (message) handleEditMessage(message);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
              >
                <FiEdit2 size={16} className="text-blue-500" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  setMessageToDelete(contextMenu.messageId);
                  setShowDeleteModal(true);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-red-600"
              >
                <FiTrash2 size={16} />
                <span>Delete</span>
              </button>
            </>
          )}
          <button
            onClick={() => {
              const message = messages.find(m => m.id === contextMenu.messageId);
              if (message) handleCopyMessage(message);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
          >
            <FiCopy size={16} className="text-gray-600" />
            <span>Copy</span>
          </button>
          <button
            onClick={() => {
              const message = messages.find(m => m.id === contextMenu.messageId);
              if (message) handleReplyMessage(message);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
          >
            <FiCornerUpLeft size={16} className="text-gray-600" />
            <span>Reply</span>
          </button>
        </div>
      )}

      {chatContextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: "fixed",
            top: chatContextMenu.y,
            left: chatContextMenu.x,
            zIndex: 1000,
          }}
          className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px]"
        >
          <button
            onClick={() => {
              setChatToDelete(chatContextMenu.chatUserId);
              setShowChatDeleteModal(true);
              setChatContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-red-600"
          >
            <FiTrash2 size={16} />
            <span>Delete Chat</span>
          </button>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <FiTrash2 className="text-red-500" size={24} />
              <h3 className="text-lg font-semibold">Delete Message</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Choose how to delete this message
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleDeleteMessage("me")}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-left"
              >
                <div className="font-semibold">Delete for me</div>
                <div className="text-sm text-gray-600">Message will be removed from your chat only</div>
              </button>
              <button
                onClick={() => handleDeleteMessage("all")}
                className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition text-left"
              >
                <div className="font-semibold text-red-600">Delete for everyone</div>
                <div className="text-sm text-red-600">Message will be removed for both participants</div>
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMessageToDelete(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showChatDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <FiTrash2 className="text-red-500" size={24} />
              <h3 className="text-lg font-semibold">Delete Chat</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Choose how to delete this chat
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleDeleteChat("me")}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-left"
              >
                <div className="font-semibold">Clear for me</div>
                <div className="text-sm text-gray-600">All messages will be cleared from your chat only</div>
              </button>
              <button
                onClick={() => handleDeleteChat("all")}
                className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition text-left"
              >
                <div className="font-semibold text-red-600">Clear for everyone</div>
                <div className="text-sm text-red-600">All messages will be deleted for both participants</div>
              </button>
              <button
                onClick={() => {
                  setShowChatDeleteModal(false);
                  setChatToDelete(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;