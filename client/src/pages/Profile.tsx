import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FiEdit3, FiUser, FiMail, FiLock, FiImage, FiTrash2, FiEdit2, FiX, FiUpload, FiCamera, FiPlus, FiHeart, FiMoreVertical, FiMessageCircle, FiSend, FiShare2 } from "react-icons/fi";
import Footer from "@/components/Footer";

interface Post {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at?: string;
  likes_count?: number;
  comments_count?: number;
  user?: {
    id: number;
    username: string;
    email: string;
    image_url?: string;
  };
}

interface User {
  id: number;
  username: string;
  email: string;
  image_url?: string;
  posts: Post[];
}

type Comment = {
  id: number;
  content: string;
  created_at: string;
  user_id: number; // Added missing field
  user: {
    id: number;
    username: string;
    image_url?: string;
  };
};

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "create" | "liked">("posts");
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [showPostMenu, setShowPostMenu] = useState<number | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState<number | null>(null);
  const [postComments, setPostComments] = useState<Comment[]>([]);
  
  // Post states
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [editPostData, setEditPostData] = useState({ title: "", content: "" });
  const [selectedPostImage, setSelectedPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [uploadingPostId, setUploadingPostId] = useState<number | null>(null);
  const [showImageModal, setShowImageModal] = useState<number | null>(null);
  
  // Create post states
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null);
  const [creatingPost, setCreatingPost] = useState(false);

  const [likedPostComments, setLikedPostComments] = useState<{ [key: number]: Comment[] }>({});
  const [showLikedPostComments, setShowLikedPostComments] = useState<{ [key: number]: boolean }>({});
  const [likedPostCommentText, setLikedPostCommentText] = useState("");
  const [commentingOnLikedPost, setCommentingOnLikedPost] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState<number | null>(null);
  const [showLikesModal, setShowLikesModal] = useState<number | null>(null);
  const [postLikes, setPostLikes] = useState<any[]>([]);
  const [editingLikedCommentId, setEditingLikedCommentId] = useState<number | null>(null);
  const [editLikedCommentText, setEditLikedCommentText] = useState("");
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      toast.error("No token found");
      setLoading(false);
      navigate("/");
      return;
    }

    const fetchUserData = async () => {
      try {
        const userRes = await axios.get("http://26.176.162.130:8080/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const postsRes = await axios.get("http://26.176.162.130:8080/posts/my-posts", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = userRes.data.user;
        setUser({
          ...userData,
          posts: postsRes.data.posts || []
        });

        console.log("User data loaded:", userData);
      } catch (err) {
        console.error("Profile load error:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate]);

  const fetchPostLikes = async (postId: number) => {
    if (!token) return;
    
    try {
      const res = await axios.get(`http://26.176.162.130:8080/posts/${postId}/likes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPostLikes(res.data.likes || []);
    } catch (err) {
      console.error("Failed to fetch likes:", err);
    }
  };

  const fetchLikedPosts = async () => {
    if (!token) return;
    
    try {
      const res = await axios.get("http://26.176.162.130:8080/posts/liked/my-likes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLikedPosts(res.data.posts || []);
    } catch (err) {
      console.error("Failed to fetch liked posts:", err);
      toast.error("Failed to load liked posts");
    }
  };

  const fetchPostComments = async (postId: number) => {
    if (!token) return;
    
    try {
      const res = await axios.get(`http://26.176.162.130:8080/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPostComments(res.data.comments || []);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      toast.error("Failed to load comments");
    }
  };

  useEffect(() => {
    if (activeTab === "liked") {
      fetchLikedPosts();
    }
  }, [activeTab, token]);

  const handleNewPostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must not exceed 5MB");
      e.target.value = "";
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WEBP images are allowed");
      e.target.value = "";
      return;
    }

    setNewPostImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPostImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleLikeOnLikedPost = async (postId: number) => {
    if (!token) return;

    try {
      const res = await axios.post(
        `http://26.176.162.130:8080/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // If unliked, remove from liked posts
      if (!res.data.liked) {
        setLikedPosts((prev) => prev.filter((p) => p.id !== postId));
        toast.success("Removed from liked posts");
      } else {
        // Update like count
        setLikedPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, likes_count: (post.likes_count || 0) + 1 }
              : post
          )
        );
      }
    } catch (err) {
      console.error("Like error:", err);
      toast.error("Failed to update like");
    }
  };

  const fetchLikedPostComments = async (postId: number) => {
    if (!token) return;

    try {
      const res = await axios.get(
        `http://26.176.162.130:8080/posts/${postId}/comments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLikedPostComments((prev) => ({
        ...prev,
        [postId]: res.data.comments || [],
      }));
    } catch (err) {
      console.error("Fetch comments error:", err);
      toast.error("Failed to load comments");
    }
  };

  const toggleLikedPostComments = async (postId: number) => {
    if (!showLikedPostComments[postId]) {
      await fetchLikedPostComments(postId);
    }
    setShowLikedPostComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleLikedPostCommentSubmit = async (postId: number) => {
    if (!token || !likedPostCommentText.trim()) return;

    try {
      const res = await axios.post(
        `http://26.176.162.130:8080/posts/${postId}/comments`,
        { content: likedPostCommentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLikedPostComments((prev) => ({
        ...prev,
        [postId]: [res.data.comment, ...(prev[postId] || [])],
      }));

      setLikedPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments_count: (post.comments_count || 0) + 1 }
            : post
        )
      );

      setLikedPostCommentText("");
      setCommentingOnLikedPost(null);
      toast.success("Comment added!");
    } catch (err) {
      console.error("Comment error:", err);
      toast.error("Failed to add comment");
    }
  };

  

  const handleDeleteLikedPostComment = async (commentId: number, postId: number) => {
    if (!token) return;
    if (!confirm("Delete this comment?")) return;

    try {
      await axios.delete(`http://26.176.162.130:8080/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLikedPostComments((prev) => ({
        ...prev,
        [postId]: prev[postId]?.filter((c) => c.id !== commentId) || [],
      }));

      setLikedPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments_count: Math.max(0, (post.comments_count || 1) - 1) }
            : post
        )
      );

      toast.success("Comment deleted");
    } catch (err) {
      console.error("Delete comment error:", err);
      toast.error("Failed to delete comment");
    }
  };

  const handleEditLikedPostComment = (commentId: number, currentContent: string) => {
    setEditingLikedCommentId(commentId);
    setEditLikedCommentText(currentContent);
  };
  const handleUpdateLikedPostComment = async (commentId: number, postId: number) => {
    if (!token || !editLikedCommentText.trim()) return;

    try {
      const res = await axios.put(
        `http://26.176.162.130:8080/comments/${commentId}`,
        { content: editLikedCommentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLikedPostComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((c) =>
          c.id === commentId ? { ...c, content: res.data.comment.content } : c
        ),
      }));

      setEditingLikedCommentId(null);
      setEditLikedCommentText("");
      toast.success("Comment updated!");
    } catch (err) {
      console.error("Update comment error:", err);
      toast.error("Failed to update comment");
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handlePostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must not exceed 5MB");
      e.target.value = "";
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WEBP images are allowed");
      e.target.value = "";
      return;
    }

    setSelectedPostImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPostImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPostImage = async (postId: number) => {
    if (!selectedPostImage) {
      toast.warn("Please select an image first");
      return;
    }

    if (uploadingPostId || !token) return;

    const formData = new FormData();
    formData.append("image", selectedPostImage);

    setUploadingPostId(postId);

    try {
      const res = await axios.post(
        `http://26.176.162.130:8080/posts/${postId}/upload-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Post image uploaded successfully!");
      setUser((prev) =>
        prev
          ? {
              ...prev,
              posts: prev.posts.map((p) =>
                p.id === postId ? { ...p, image_url: res.data.image_url } : p
              ),
            }
          : prev
      );
      setSelectedPostImage(null);
      setPostImagePreview(null);
      setShowImageModal(null);
    } catch (err: any) {
      console.error("Upload post image error:", err);
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data.error || "Failed to upload image");
      } else {
        toast.error("Failed to upload image");
      }
    } finally {
      setUploadingPostId(null);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.warn("Title and content are required");
      return;
    }

    if (!token) return;

    setCreatingPost(true);

    try {
      const formData = new FormData();
      formData.append("title", newPost.title.trim());
      formData.append("content", newPost.content.trim());
      
      if (newPostImage) {
        formData.append("image", newPostImage);
      }

      const res = await axios.post(
        "http://26.176.162.130:8080/posts",
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          } 
        }
      );
      
      const createdPost = res.data.post;
      
      toast.success(newPostImage ? "Post created with image!" : "Post created successfully!");

      setUser((prev) =>
        prev ? { ...prev, posts: [createdPost, ...prev.posts] } : prev
      );
      
      setNewPost({ title: "", content: "" });
      setNewPostImage(null);
      setNewPostImagePreview(null);
      setActiveTab("posts");
    } catch (err: any) {
      console.error("Create post error:", err);
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data.error || "Failed to create post");
      } else {
        toast.error("Failed to create post");
      }
    } finally {
      setCreatingPost(false);
    }
  };

  const handleStartEdit = (post: Post) => {
    setEditingPost(post.id);
    setEditPostData({ title: post.title, content: post.content });
    setShowPostMenu(null);
  };

  const handleUpdatePost = async (postId: number) => {
    if (!editPostData.title.trim() || !editPostData.content.trim()) {
      toast.warn("Title and content are required");
      return;
    }

    if (!token) return;

    try {
      const res = await axios.put(
        `http://26.176.162.130:8080/posts/${postId}`,
        editPostData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Post updated!");
      setUser((prev) =>
        prev
          ? {
              ...prev,
              posts: prev.posts.map((p) =>
                p.id === postId ? res.data.post : p
              ),
            }
          : prev
      );
      setEditingPost(null);
      setEditPostData({ title: "", content: "" });
    } catch (err: any) {
      console.error("Update post error:", err);
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data.error || "Failed to update post");
      } else {
        toast.error("Failed to update post");
      }
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    if (!token) return;

    try {
      await axios.delete(`http://26.176.162.130:8080/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Post deleted");
      setUser((prev) =>
        prev ? { ...prev, posts: prev.posts.filter((p) => p.id !== id) } : prev
      );
      setShowPostMenu(null);
    } catch (err: any) {
      console.error("Delete post error:", err);
      toast.error("Failed to delete post");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <p className="text-center mt-10 text-gray-600">No profile found</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="mb-8 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="h-48 md:h-56 relative overflow-hidden bg-gradient-to-br from-white via-orange-50 to-purple-50">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-300/30 to-pink-300/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-300/30 to-blue-300/30 rounded-full blur-3xl"></div>
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\\"60\\" height=\\"60\\" viewBox=\\"0 0 60 60\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cg fill=\\"none\\" fill-rule=\\"evenodd\\"%3E%3Cg fill=\\"%23000000\\" fill-opacity=\\"1\\"%3E%3Cpath d=\\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/50"></div>
          </div>
          
          <div className="px-6 md:px-10 pb-8 relative z-20">
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-20 md:-mt-24">
              <div className="relative group z-30">
                <div className="w-26 h-26 md:w-30 md:h-30 rounded-full border-6 border-white shadow-2xl bg-white overflow-hidden ring-4 ring-orange-100">
                  {user.image_url ? (
                    <img
                      src={user.image_url}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <span className="text-white text-6xl font-bold">
                        {user.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full shadow-lg"></div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    @{user?.username || 'Username'}
                  </h1>
                </div>
                
                <div className="flex gap-6 mb-4">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 px-6 py-3 rounded-2xl border-2 border-orange-200 shadow-md">
                    <div className="flex items-center gap-3">
                      <FiImage className="w-6 h-6 text-orange-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{user?.posts?.length || 0}</div>
                        <div className="text-sm text-gray-600 font-semibold">Posts Published</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate("/settings")}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  <FiEdit3 className="w-5 h-5" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-xl mb-8 p-2 inline-flex gap-2 mx-auto block w-full md:w-auto">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 md:flex-initial py-4 px-8 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${
              activeTab === "posts"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FiImage className="w-5 h-5" />
            <span>My Posts</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              activeTab === "posts" ? "bg-white/20" : "bg-orange-100 text-orange-600"
            }`}>
              {user.posts.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab("liked")}
            className={`flex-1 md:flex-initial py-4 px-8 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${
              activeTab === "liked"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FiHeart className="w-5 h-5" />
            <span>Liked</span>
          </button>
          
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 md:flex-initial py-4 px-8 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${
              activeTab === "create"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FiPlus className="w-5 h-5" />
            <span>Create</span>
          </button>
        </div>

        {/* Create Post Tab */}
        {activeTab === "create" && (
          <div className="max-w-5xl mx-auto">
            {/* Modern Header with Stats */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Post</h2>
                <p className="text-gray-600">Share your story with the community</p>
              </div>
              <div className="hidden md:flex items-center gap-3 bg-gradient-to-r from-orange-50 to-red-50 px-6 py-3 rounded-2xl border border-orange-200">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center">
                  <FiEdit2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{user?.posts?.length || 0}</div>
                  <div className="text-xs text-gray-600 font-medium">Total Posts</div>
                </div>
              </div>
            </div>

            {/* Main Form Card with Modern Layout */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              
              {/* Image Upload Section - Full Width */}
              <div className="relative">
                {newPostImagePreview ? (
                  <div className="p-8 md:p-12">
                    <div className="max-w-3xl mx-auto">
                      <div className="relative group rounded-2xl overflow-hidden shadow-xl">
                        <img
                          src={newPostImagePreview}
                          alt="Preview"
                          className="w-full max-h-[500px] object-contain bg-gray-50"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => {
                            setNewPostImage(null);
                            setNewPostImagePreview(null);
                          }}
                          className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl transition-all shadow-lg hover:scale-110 z-10"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>

                        {/* Image Info Overlay */}
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl">
                            <p className="text-sm font-semibold text-gray-900">Cover Image Added</p>
                            <p className="text-xs text-gray-600 mt-1">Click the trash icon to remove or upload a different image</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 md:p-12">
                    <div className="max-w-3xl mx-auto">
                      <label className="block cursor-pointer group">
                        <div className="relative h-64 bg-gradient-to-br from-orange-50 via-orange-100 to-red-50 border-2 border-dashed border-orange-300 hover:border-orange-500 transition-all rounded-2xl">
                          {/* Animated Background Pattern */}
                          <div className="absolute inset-0 opacity-5" style={{
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23FF6B35" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                          }}></div>
                          
                          {/* Upload Content */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                              <FiImage className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition">
                              Add a Cover Image
                            </h3>
                            <p className="text-gray-600 mb-4">Drag & drop or click to browse</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span className="px-3 py-1 bg-white rounded-full border border-gray-200">JPG</span>
                              <span className="px-3 py-1 bg-white rounded-full border border-gray-200">PNG</span>
                              <span className="px-3 py-1 bg-white rounded-full border border-gray-200">WEBP</span>
                              <span className="px-3 py-1 bg-white rounded-full border border-gray-200">Max 5MB</span>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleNewPostImageSelect}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Content */}
              <div className="p-8 md:p-12">
                <div className="max-w-3xl mx-auto space-y-8">
                  
                  {/* Title Input with Icon */}
                  <div className="relative">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">📝</span>
                      </div>
                      Post Title
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter an engaging title for your post..."
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="w-full px-5 py-4 border-2 border-gray-200 hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 rounded-2xl text-lg font-semibold transition-all outline-none placeholder:text-gray-400 placeholder:font-normal"
                      maxLength={100}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">Choose a descriptive and catchy title</span>
                      {newPost.title.length > 0 && (
                        <span className={`text-xs font-medium ${
                          newPost.title.length > 80 ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                          {newPost.title.length}/100
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Textarea with Icon */}
                  <div className="relative">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">✍️</span>
                      </div>
                      Post Content
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="Share your thoughts, ideas, or story here..."
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      rows={12}
                      className="w-full px-5 py-4 border-2 border-gray-200 hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 rounded-2xl text-base leading-relaxed resize-none transition-all outline-none placeholder:text-gray-400"
                      maxLength={5000}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">Write detailed and engaging content</span>
                      {newPost.content.length > 0 && (
                        <span className={`text-xs font-medium ${
                          newPost.content.length > 4500 ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                          {newPost.content.length}/5000
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Validation Warning */}
                  {(!newPost.title.trim() || !newPost.content.trim()) && (newPost.title || newPost.content) && (
                    <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-orange-500 rounded-xl">
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 mb-1">Action Required</p>
                        <p className="text-sm text-gray-700">
                          Both title and content are required to publish your post. Please fill in all fields marked with <span className="text-red-500 font-bold">*</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      onClick={() => {
                        setNewPost({ title: '', content: '' });
                        setNewPostImage(null);
                        setNewPostImagePreview(null);
                      }}
                      disabled={creatingPost}
                      className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPost.title.trim() || !newPost.content.trim() || creatingPost}
                      className={`flex-1 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg ${
                        newPost.title.trim() && newPost.content.trim() && !creatingPost
                          ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 hover:from-orange-600 hover:via-orange-700 hover:to-red-600 text-white hover:shadow-xl hover:scale-[1.02]'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {creatingPost ? (
                        <>
                          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Publishing Post...</span>
                        </>
                      ) : (
                        <>
                          <FiUpload className="w-6 h-6" />
                          <span>Publish Post</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips & Guidelines */}
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Write Clearly</h4>
                <p className="text-sm text-gray-600">Use simple language and organize your thoughts into clear paragraphs.</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mb-4">
                  <FiImage className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Add Visuals</h4>
                <p className="text-sm text-gray-600">Include a high-quality cover image to make your post more engaging.</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Be Authentic</h4>
                <p className="text-sm text-gray-600">Share your unique perspective and personal experiences honestly.</p>
              </div>
            </div>
          </div>
        )}

        {/* My Posts Tab */}
        {activeTab === "posts" && (
          <div>
            {user.posts && user.posts.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all group border border-gray-100 relative">
                    {editingPost === post.id ? (
                      <div className="p-6">
                        <input
                          value={editPostData.title}
                          onChange={(e) =>
                            setEditPostData({ ...editPostData, title: e.target.value })
                          }
                          className="border-2 border-orange-400 p-3 rounded-xl w-full mb-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-200"
                          placeholder="Post title..."
                        />
                        <textarea
                          value={editPostData.content}
                          onChange={(e) =>
                            setEditPostData({ ...editPostData, content: e.target.value })
                          }
                          rows={6}
                          className="border-2 border-orange-400 p-3 rounded-xl w-full mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-orange-200"
                          placeholder="Post content..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdatePost(post.id)}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl transition font-semibold shadow-md flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingPost(null);
                              setEditPostData({ title: "", content: "" });
                            }}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl transition font-semibold shadow-md"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Three Dot Menu */}
                        <div className="absolute top-3 right-3 z-20">
                          <button
                            onClick={() => setShowPostMenu(showPostMenu === post.id ? null : post.id)}
                            className="bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition"
                          >
                            <FiMoreVertical className="w-5 h-5 text-gray-700" />
                          </button>
                          
                          {showPostMenu === post.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-30">
                              <button
                                onClick={() => handleStartEdit(post)}
                                className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3 text-gray-700 hover:text-blue-600 transition"
                              >
                                <FiEdit2 className="w-4 h-4" />
                                <span className="font-medium">Edit Post</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setShowImageModal(post.id);
                                  setShowPostMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-purple-50 flex items-center gap-3 text-gray-700 hover:text-purple-600 transition"
                              >
                                <FiCamera className="w-4 h-4" />
                                <span className="font-medium">Change Photo</span>
                              </button>
                              
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-gray-700 hover:text-red-600 transition"
                              >
                                <FiTrash2 className="w-4 h-4" />
                                <span className="font-medium">Delete</span>
                              </button>
                              
                              <div className="border-t border-gray-100 my-2"></div>
                              
                              <button
                                onClick={async () => {
                                  await fetchPostComments(post.id);
                                  setShowCommentsModal(post.id);
                                  setShowPostMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-green-50 flex items-center gap-3 text-gray-700 hover:text-green-600 transition"
                              >
                                <FiMessageCircle className="w-4 h-4" />
                                <span className="font-medium">View Comments</span>
                              </button>
                              <button
                                onClick={async () => {
                                  await fetchPostLikes(post.id);
                                  setShowLikesModal(post.id);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-green-50 flex items-center gap-3 text-gray-700 hover:text-green-600 transition"
                              >
                                <FiHeart className="w-4 h-4" />
                                <span>View Likes</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Post Image */}
                        {post.image_url ? (
                          <div className="relative h-72 overflow-hidden">
                            <img
                              src={post.image_url}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                              <h4 className="text-white font-bold text-xl line-clamp-2 mb-2">
                                {post.title}
                              </h4>
                              <p className="text-white/80 text-sm flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(post.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="h-72 bg-gradient-to-br from-orange-100 via-orange-200 to-red-100 flex items-center justify-center relative overflow-hidden">
                            <FiImage className="w-20 h-20 text-orange-400" />
                          </div>
                        )}

                        {/* Post Content & Stats */}
                        <div className="p-5">
                          {!post.image_url && (
                            <>
                              <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                {post.title}
                              </h4>
                              <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                                {new Date(post.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            </>
                          )}
                          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                            {post.content}
                          </p>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1">
                              <FiHeart className="w-4 h-4" />
                              <span className="font-semibold">{post.likes_count || 0}</span>
                              <span>likes</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FiMessageCircle className="w-4 h-4" />
                              <span className="font-semibold">{post.comments_count || 0}</span>
                              <span>comments</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-2xl p-20 text-center border border-gray-100">
                <div className="w-40 h-40 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <FiImage className="w-20 h-20 text-orange-500" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Your Canvas Awaits</h3>
                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                  Start your creative journey. Share your first story with the world today!
                </p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-10 py-5 rounded-2xl hover:shadow-2xl transition-all font-bold text-lg inline-flex items-center gap-3 hover:scale-105"
                >
                  <FiPlus className="w-6 h-6" />
                  Create Your First Post
                </button>
              </div>
            )}
          </div>
        )}

        {/* Liked Posts Tab */}
        {activeTab === "liked" && (
          <div className="max-w-2xl mx-auto">
            {likedPosts.length > 0 ? (
              <div className="space-y-6">
                {likedPosts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                  >
                    {/* Post Header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {post.user?.image_url ? (
                          <img
                            src={post.user.image_url}
                            alt={post.user.username}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-orange-100"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center ring-2 ring-orange-100">
                            <span className="text-white font-bold text-sm">
                              {post.user?.username?.[0]?.toUpperCase() || "U"}
                            </span>
                          </div>
                        )}

                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {post.user?.username || "Unknown User"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(post.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Post Image */}
                    {post.image_url && (
                      <div className="relative w-full bg-gray-100">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full max-h-[600px] object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => toggleLikeOnLikedPost(post.id)}
                            className="group flex items-center gap-2 transition-all"
                          >
                            <FiHeart
                              className="text-xl transition-all duration-300 fill-red-500 text-red-500 scale-110"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {post.likes_count || 0}
                            </span>
                          </button>

                          <button
                            onClick={() => toggleLikedPostComments(post.id)}
                            className="group flex items-center gap-2 transition-all"
                          >
                            <FiMessageCircle className="text-xl text-gray-700 group-hover:text-blue-500 transition" />
                            <span className="text-sm font-medium text-gray-700">
                              {post.comments_count || 0}
                            </span>
                          </button>
                          <button
                            onClick={() => setShowShareModal(post.id)}
                            className="group flex items-center gap-2 transition-all"
                          >
                            <FiShare2 className="text-xl text-gray-700 group-hover:text-green-500 transition" />
                            <span className="text-sm font-medium text-gray-700">Share</span>
                          </button>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="space-y-2">
                        {post.title && (
                          <h2 className="text-lg font-bold text-gray-900">
                            {post.title}
                          </h2>
                        )}
                        <p className="text-gray-700 leading-relaxed">
                          <span className="font-semibold text-gray-900">
                            {post.user?.username}
                          </span>{" "}
                          {post.content}
                        </p>
                      </div>

                      {/* Comments Section */}
                      {showLikedPostComments[post.id] && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex gap-2 mb-4">
                            <input
                              type="text"
                              value={
                                commentingOnLikedPost === post.id
                                  ? likedPostCommentText
                                  : ""
                              }
                              onFocus={() => setCommentingOnLikedPost(post.id)}
                              onChange={(e) => setLikedPostCommentText(e.target.value)}
                              placeholder="Add a comment..."
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  handleLikedPostCommentSubmit(post.id);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleLikedPostCommentSubmit(post.id)}
                              disabled={!likedPostCommentText.trim()}
                              className={`px-4 py-2 rounded-xl transition ${
                                likedPostCommentText.trim()
                                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              <FiSend className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {likedPostComments[post.id]?.map((comment) => (
                              <div
                                key={comment.id}
                                className="flex gap-3 bg-gray-50 p-3 rounded-xl"
                              >
                                {comment.user?.image_url ? (
                                  <img
                                    src={comment.user.image_url}
                                    alt={comment.user.username}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">
                                      {comment.user?.username?.[0]?.toUpperCase() ||
                                        "U"}
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-sm text-gray-900">
                                        {comment.user?.username}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {formatTimeAgo(comment.created_at)}
                                      </span>
                                    </div>
                                      {user?.id === comment.user_id && (
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleEditLikedPostComment(comment.id, comment.content)}
                                            className="text-blue-500 hover:text-blue-700 transition"
                                            title="Edit comment"
                                          >
                                            <FiEdit2 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteLikedPostComment(comment.id, post.id)}
                                            className="text-red-500 hover:text-red-700 transition"
                                            title="Delete comment"
                                          >
                                            <FiTrash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                  </div>
                                    {editingLikedCommentId === comment.id ? (
                                      <div className="flex gap-2 mt-2">
                                        <input
                                          type="text"
                                          value={editLikedCommentText}
                                          onChange={(e) => setEditLikedCommentText(e.target.value)}
                                          className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                          autoFocus
                                          onKeyPress={(e) => {
                                            if (e.key === "Enter" && editLikedCommentText.trim()) {
                                              handleUpdateLikedPostComment(comment.id, post.id);
                                            }
                                            if (e.key === "Escape") {
                                              setEditingLikedCommentId(null);
                                              setEditLikedCommentText("");
                                            }
                                          }}
                                        />
                                        <button
                                          onClick={() => handleUpdateLikedPostComment(comment.id, post.id)}
                                          disabled={!editLikedCommentText.trim()}
                                          className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingLikedCommentId(null);
                                            setEditLikedCommentText("");
                                          }}
                                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-700">{comment.content}</p>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-2xl p-20 text-center border border-gray-100">
                <div className="w-40 h-40 bg-gradient-to-br from-red-100 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <FiHeart className="w-20 h-20 text-red-500" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  No Liked Posts Yet
                </h3>
                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                  Start exploring and like posts that inspire you!
                </p>
              </div>
            )}
          </div>
        )}

      {/* Comments Modal */}
      {showCommentsModal !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 z-50">
          <div className="bg-white shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden border border-gray-100 max-h-[80vh] flex flex-col">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FiMessageCircle className="w-6 h-6" />
                  Comments
                </h2>
                <p className="text-white/90 mt-1">{postComments.length} comments</p>
              </div>
              <button
                onClick={() => {
                  setShowCommentsModal(null);
                  setPostComments([]);
                }}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition backdrop-blur-sm"
              >
                <FiX className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {postComments.length > 0 ? (
                <div className="space-y-4">
                  {postComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 bg-gray-50 p-4 rounded-xl">
                      {comment.user?.image_url ? (
                        <img
                          src={comment.user.image_url}
                          alt={comment.user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {comment.user?.username?.[0]?.toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {comment.user?.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiMessageCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600">No comments yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Likes Modal */}
      {showLikesModal !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 z-50">
          <div className="bg-white shadow-2xl rounded-3xl w-full max-w-md overflow-hidden border border-gray-100 max-h-[70vh] flex flex-col">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FiHeart className="w-6 h-6 fill-white" />
                  Likes
                </h2>
                <p className="text-white/90 mt-1">{postLikes.length} people liked this</p>
              </div>
              <button
                onClick={() => {
                  setShowLikesModal(null);
                  setPostLikes([]);
                }}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition backdrop-blur-sm"
              >
                <FiX className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {postLikes.length > 0 ? (
                <div className="space-y-3">
                  {postLikes.map((like) => (
                    <div key={like.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                      {like.user?.image_url ? (
                        <img
                          src={like.user.image_url}
                          alt={like.user.username}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-red-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-pink-600 flex items-center justify-center ring-2 ring-red-200">
                          <span className="text-white font-bold text-lg">
                            {like.user?.username?.[0]?.toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {like.user?.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          {like.user?.email}
                        </p>
                      </div>
                      <FiHeart className="w-5 h-5 text-red-500 fill-red-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiHeart className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600">No likes yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
        {showShareModal !== null && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 z-50">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Share Post</h3>
                <button
                  onClick={() => setShowShareModal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Copy Link */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/post/${showShareModal}`}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/post/${showShareModal}`);
                      alert("Link copied!");
                    }}
                    className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Image Upload Modal */}
      {showImageModal !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 z-50 animate-fadeIn">
          <div className="bg-white shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-slideUp">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <FiCamera className="w-6 h-6" />
                </div>
                Update Post Image
              </h2>
              <p className="text-white/90 mt-1">Make your post stand out with a stunning image</p>
            </div>

            <div className="p-8">
              {postImagePreview && (
                <div className="mb-6 rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={postImagePreview}
                    alt="Preview"
                    className="w-full h-80 object-cover"
                  />
                </div>
              )}

              <label className="block border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all group mb-6">
                {selectedPostImage ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                      <FiImage className="w-10 h-10 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-purple-600 font-bold text-lg">
                        {selectedPostImage.name.substring(0, 40)}...
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {(selectedPostImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FiImage className="w-10 h-10 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-gray-700 font-bold text-lg group-hover:text-purple-600 transition">
                        Choose an image
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Max 5MB • JPG, PNG, WEBP
                      </p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePostImageSelect}
                />
              </label>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setSelectedPostImage(null);
                    setPostImagePreview(null);
                    setShowImageModal(null);
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-xl transition font-bold text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUploadPostImage(showImageModal)}
                  disabled={!selectedPostImage || uploadingPostId === showImageModal}
                  className={`flex-1 py-4 rounded-xl transition font-bold text-lg flex items-center justify-center gap-3 ${
                    !selectedPostImage || uploadingPostId === showImageModal
                      ? "bg-gray-300 cursor-not-allowed text-gray-500"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:shadow-xl text-white"
                  }`}
                >
                  {uploadingPostId === showImageModal ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload className="w-5 h-5" />
                      Upload Image
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Profile;