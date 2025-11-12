import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FiEdit3, FiUser, FiMail, FiLock, FiImage, FiTrash2, FiEdit2, FiX, FiUpload, FiCamera, FiPlus } from "react-icons/fi";
import Footer from "@/components/Footer";

interface Post {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  image_url?: string;
  posts: Post[];
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "create">("posts");
  
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

        console.log("User data loaded:", userData); // Debug log
      } catch (err) {
        console.error("Profile load error:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate]);

  const handleNewPostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must not exceed 5MB");
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

    if (uploadingPostId) return;

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
  };

  const handleUpdatePost = async (postId: number) => {
    if (!editPostData.title.trim() || !editPostData.content.trim()) {
      toast.warn("Title and content are required");
      return;
    }

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

    try {
      await axios.delete(`http://26.176.162.130:8080/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Post deleted");
      setUser((prev) =>
        prev ? { ...prev, posts: prev.posts.filter((p) => p.id !== id) } : prev
      );
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
        {/* Profile Header - Modern Clean Design */}
        <div className="mb-8 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Modern Clean Banner with Blur Effect */}
          <div className="h-48 md:h-56 relative overflow-hidden bg-gradient-to-br from-white via-orange-50 to-purple-50">
            {/* Blur circles for depth */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-300/30 to-pink-300/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-300/30 to-blue-300/30 rounded-full blur-3xl"></div>
            
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}></div>

            {/* Soft gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/50"></div>
          </div>
          
          <div className="px-6 md:px-10 pb-8 relative z-20">
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-20 md:-mt-24">
              {/* Profile Picture - ROUNDED */}
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
                
                {/* Online status indicator */}
                <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full shadow-lg"></div>
              </div>

              {/* User Info - WITH USERNAME AND EMAIL */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    @{user?.username || 'Username'}
                  </h1>
                </div>
                
                {/* Stats - POST COUNT */}
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
            <span>My Content</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              activeTab === "posts" ? "bg-white/20" : "bg-orange-100 text-orange-600"
            }`}>
              {user.posts.length}
            </span>
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
            <span>New Post</span>
          </button>
        </div>

        {/* Create Post Tab - MODERN ORANGE DESIGN */}
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
                  <div key={post.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all group border border-gray-100">
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
                            <div className="absolute inset-0 opacity-10" style={{
                              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                            }}></div>
                            <FiImage className="w-20 h-20 text-orange-400" />
                          </div>
                        )}

                        {/* Post Content */}
                        <div className="p-5">
                          {!post.image_url && (
                            <>
                              <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                {post.title}
                              </h4>
                              <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
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

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStartEdit(post)}
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl transition font-semibold shadow-md flex items-center justify-center gap-2 hover:scale-105"
                            >
                              <FiEdit2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => setShowImageModal(post.id)}
                              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl transition font-semibold shadow-md flex items-center justify-center gap-2 hover:scale-105"
                            >
                              <FiCamera className="w-4 h-4" />
                              <span className="hidden sm:inline">Photo</span>
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl transition font-semibold shadow-md flex items-center justify-center gap-2 hover:scale-105"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
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
      </div>

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
  );
};

export default Profile;