import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FiEdit3 } from "react-icons/fi";

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
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [editPostData, setEditPostData] = useState({ title: "", content: "" });
  const [selectedPostImage, setSelectedPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [uploadingPostId, setUploadingPostId] = useState<number | null>(null);
  const [showImageModal, setShowImageModal] = useState<number | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null);
  const [creatingPost, setCreatingPost] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

  // Fetch user data and posts
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

        setUser({
          ...userRes.data.user,
          posts: postsRes.data.posts || []
        });
        setUsername(userRes.data.user.username);
        setEmail(userRes.data.user.email);
      } catch (err) {
        console.error("Profile load error:", err);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate]);

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      if (!user) {
        toast.error("User data not available");
        return;
      }

      const updatedData: Record<string, string> = {};
      
      if (username.trim() !== "" && username !== user.username) {
        updatedData.username = username.trim();
      }
      
      if (email.trim() !== "" && email !== user.email) {
        updatedData.email = email.trim();
      }

      if (Object.keys(updatedData).length === 0) {
        toast.info("No changes detected");
        return;
      }

      const res = await axios.put(
        "http://26.176.162.130:8080/users/update",
        updatedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data && res.data.user) {
        setUser(prev => prev ? { ...prev, ...res.data.user } : null);
        setUsername(res.data.user.username);
        setEmail(res.data.user.email);
        toast.success("Profile updated successfully");
      }

      if (res.data.email_verification_required) {
        toast.info("Please verify your new email address. Check your inbox!");
      }
    } catch (err: any) {
      console.error("Update error:", err);
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data.error || "Failed to update profile");
      } else {
        toast.error("Network or server error");
      }
      if (user) {
        setUsername(user.username);
        setEmail(user.email);
      }
    }
  };

  // Handle profile image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle profile image upload
  const handleImageUpload = async () => {
    if (!selectedImage) {
      toast.warn("Please select an image first");
      return;
    }

    if (uploading) return;

    const formData = new FormData();
    formData.append("image", selectedImage);

    setUploading(true);

    try {
      const res = await axios.post(
        "http://26.176.162.130:8080/users/upload-image",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      toast.success("Profile image updated successfully!");
      setUser((prev) =>
        prev ? { ...prev, image_url: res.data.image_url } : prev
      );
      setSelectedImage(null);
      setImagePreview(null);
    } catch (err: any) {
      console.error("Image upload error:", err);
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data.error || "Image upload failed");
      } else {
        toast.error("Image upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCancelImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.warn("Please fill all password fields");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPassword.length > 72) {
      toast.error("Password must not exceed 72 characters");
      return;
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasDigit) {
      toast.error("Password must contain uppercase, lowercase, and numbers");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    if (oldPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    try {
      await axios.put(
        "http://26.176.162.130:8080/users/password",
        {
          old_password: oldPassword,
          new_password: newPassword,
          confirm_new_password: confirmPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Password updated successfully");
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Password change error:", err);
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data.error || "Failed to change password");
      } else {
        toast.error("Failed to change password");
      }
    }
  };

  // Handle post image selection
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

  // Upload post image
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

  const handleCancelPostImage = () => {
    setSelectedPostImage(null);
    setPostImagePreview(null);
    setShowImageModal(null);
  };

  // Handle new post image selection
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

  const handleRemoveNewPostImage = () => {
    setNewPostImage(null);
    setNewPostImagePreview(null);
  };

  // Handle create post
const handleCreatePost = async () => {
  if (!newPost.title.trim() || !newPost.content.trim()) {
    toast.warn("Title and content are required");
    return;
  }

  setCreatingPost(true);

  try {
    // ✅ THIS IS THE CODE - It's already here!
    const formData = new FormData();
    formData.append("title", newPost.title.trim());
    formData.append("content", newPost.content.trim());
    
    // Add image if exists
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
    
    // Reset form
    setNewPost({ title: "", content: "" });
    setNewPostImage(null);
    setNewPostImagePreview(null);
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

  // Update post
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

  // Delete post
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
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data.error || "Failed to delete post");
      } else {
        toast.error("Failed to delete post");
      }
    }
  };

  if (loading) {
    return <p className="text-center mt-10 text-gray-600">Loading profile...</p>;
  }
  
  if (!user) {
    return <p className="text-center mt-10 text-gray-600">No profile found</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center md:text-left">
        My Profile
      </h1>

      <div className="bg-white shadow-lg p-6 rounded-xl mb-6">
        {/* Profile Image + Upload */}
        <div className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0 mb-6">
          <div className="relative">
            <img
              src={
                imagePreview || 
                user.image_url || 
                "/default-avatar.png"
              }
              alt="profile"
              className="w-24 h-24 bg-gray-200 rounded-full border-2 border-gray-300 object-cover"
            />
            {selectedImage && (
              <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                ✓
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <label className="border px-3 py-2 rounded w-full sm:w-60 cursor-pointer italic font-light text-center hover:bg-gray-50 transition">
              {selectedImage ? (
                <span className="text-orange-500 font-medium">
                  {selectedImage.name.length > 20
                    ? selectedImage.name.substring(0, 20) + "..."
                    : selectedImage.name}
                </span>
              ) : (
                "Choose Image"
              )}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleImageSelect}
              />
            </label>

            {selectedImage ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleImageUpload}
                  disabled={uploading}
                  className={`py-2 px-4 rounded transition flex-1 sm:flex-initial ${
                    uploading 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-orange-500 hover:bg-orange-600"
                  } text-white`}
                >
                  {uploading ? "⏳ Uploading..." : "Upload Image"}
                </button>
                <button
                  onClick={handleCancelImage}
                  className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                disabled
                className="bg-gray-300 text-gray-500 py-2 px-4 rounded w-full sm:w-auto cursor-not-allowed"
              >
                Select Image First
              </button>
            )}
          </div>
        </div>

        {selectedImage && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="text-blue-700">
              📷 <strong>Selected:</strong> {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500 mb-6 text-center">
          Max 5MB • JPG, PNG, WEBP only
        </p>

        {/* Username Field */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Username</label>
          <div className="flex items-center gap-2">
            <input
              ref={usernameRef}
              type="text"
              value={username}
              readOnly={!editingUsername}
              onChange={(e) => setUsername(e.target.value)}
              className={`border p-2 rounded w-full ${
                editingUsername ? "bg-white border-orange-400" : "bg-gray-100 cursor-not-allowed"
              }`}
            />
            {editingUsername ? (
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await handleUpdateProfile();
                    setEditingUsername(false);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded transition whitespace-nowrap"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setUsername(user.username);
                    setEditingUsername(false);
                  }}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded transition whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <FiEdit3
                className="w-5 h-5 text-gray-600 cursor-pointer hover:text-orange-500 transition flex-shrink-0"
                onClick={() => {
                  setEditingUsername(true);
                  setTimeout(() => usernameRef.current?.focus(), 0);
                }}
              />
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-1">Email</label>
          <div className="flex items-center gap-2">
            <input
              ref={emailRef}
              type="email"
              value={email}
              readOnly={!editingEmail}
              onChange={(e) => setEmail(e.target.value)}
              className={`border p-2 rounded w-full ${
                editingEmail ? "bg-white border-orange-400" : "bg-gray-100 cursor-not-allowed"
              }`}
            />
            {editingEmail ? (
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await handleUpdateProfile();
                    setEditingEmail(false);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded transition whitespace-nowrap"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEmail(user.email);
                    setEditingEmail(false);
                  }}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded transition whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <FiEdit3
                className="w-5 h-5 text-gray-600 cursor-pointer hover:text-orange-500 transition flex-shrink-0"
                onClick={() => {
                  setEditingEmail(true);
                  setTimeout(() => emailRef.current?.focus(), 0);
                }}
              />
            )}
          </div>
        </div>

        {/* Change Password Button */}
        <div className="flex justify-start">
          <Button
            variant="default"
            onClick={() => setShowPasswordModal(true)}
            className="bg-gray-700 hover:bg-gray-800 text-white py-3 px-5"
          >
            Change Password
          </Button>
        </div>
      </div>

      {/* Posts Section */}
      <h3 className="text-2xl font-bold mb-4 text-gray-800 text-center md:text-left">
        My Posts
      </h3>

      {/* Add new post */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
          <h4 className="text-xl font-bold text-white flex items-center gap-2">
            Create New Post
          </h4>
        </div>

        <div className="p-6">
          {/* IMAGE SECTION - FIRST */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-lg">🖼️</span> Post Image
            </label>
            
            {newPostImagePreview ? (
              <div className="relative group">
                <img
                  src={newPostImagePreview}
                  alt="Preview"
                  className="w-full h-80 object-cover rounded-xl border-4 border-orange-200 shadow-lg transition-transform group-hover:scale-[1.02]"
                />
                <button
                  onClick={handleRemoveNewPostImage}
                  className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-2xl transition-all hover:scale-110"
                  title="Remove image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                  {newPostImage && `📎 ${(newPostImage.size / 1024 / 1024).toFixed(2)} MB`}
                </div>
              </div>
            ) : (
              <label className="block border-3 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all group">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-700 group-hover:text-orange-600 transition">
                      Click to upload image
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      JPG, PNG, WEBP • Max 5MB
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleNewPostImageSelect}
                />
              </label>
            )}
          </div>

          {/* TITLE SECTION - SECOND */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">📝</span> Post Title
            </label>
            <input
              placeholder="Enter an eye-catching title..."
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="border-2 border-gray-300 p-4 rounded-xl w-full text-lg font-medium focus:border-orange-400 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all"
            />
          </div>
          
          {/* CONTENT SECTION - THIRD */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">💬</span> Post Content
            </label>
            <textarea
              placeholder="Share your thoughts, ideas, or story..."
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              rows={6}
              className="border-2 border-gray-300 p-4 rounded-xl w-full text-base leading-relaxed resize-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            onClick={handleCreatePost}
            disabled={creatingPost}
            className={`w-2/4 mx-auto py-4 px-6 rounded-xl transition-all font-bold text-lg flex items-center justify-center gap-3 shadow-lg ${
              creatingPost
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transform hover:scale-[1.02] hover:shadow-xl"
            } text-white`}
          >
            {creatingPost ? (
              <>
                <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Post...</span>
              </>
            ) : (
              <>
                <span>Publish Post</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Show posts */}
      <div className="grid gap-6 mt-8">
        {user.posts && user.posts.length > 0 ? (
          user.posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
              {editingPost === post.id ? (
                <div className="p-6">
                  <input
                    value={editPostData.title}
                    onChange={(e) =>
                      setEditPostData({ ...editPostData, title: e.target.value })
                    }
                    className="border-2 p-3 rounded-lg w-full mb-3 text-lg font-semibold focus:border-orange-400 focus:outline-none"
                  />
                  <textarea
                    value={editPostData.content}
                    onChange={(e) =>
                      setEditPostData({ ...editPostData, content: e.target.value })
                    }
                    rows={6}
                    className="border-2 p-3 rounded-lg w-full mb-4 resize-none focus:border-orange-400 focus:outline-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUpdatePost(post.id)}
                      className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg transition font-semibold shadow-md"
                    >
                      ✅ Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setEditingPost(null);
                        setEditPostData({ title: "", content: "" });
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg transition font-semibold shadow-md"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* IMAGE FIRST - Full width hero style */}
                  {post.image_url && (
                    <div className="relative h-96 overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>
                  )}

                  {/* CONTENT SECTION */}
                  <div className="p-6">
                    {/* TITLE - SECOND */}
                    <h4 className="text-2xl font-bold text-gray-800 mb-4 leading-tight">
                      {post.title}
                    </h4>

                    {/* CONTENT - THIRD */}
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4 text-base">
                      {post.content}
                    </p>

                    {/* META INFO */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 pb-4 border-b">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {new Date(post.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => handleStartEdit(post)}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-5 rounded-lg transition font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => setShowImageModal(post.id)}
                        className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-5 rounded-lg transition font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {post.image_url ? "Change" : "Add"} Image
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-5 rounded-lg transition font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg font-medium">No posts yet</p>
            <p className="text-gray-400 text-sm mt-2">Create your first post above to get started!</p>
          </div>
        )}
      </div>

      {/* Image Upload Modal */}
      {showImageModal !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4 z-50">
          <div className="bg-white shadow-2xl p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Upload Post Image
            </h2>

            {postImagePreview && (
              <div className="mb-4">
                <img
                  src={postImagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                />
              </div>
            )}

            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-orange-400 transition mb-4">
              {selectedPostImage ? (
                <div>
                  <p className="text-orange-500 font-medium">
                    📎 {selectedPostImage.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(selectedPostImage.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium">
                    📁 Click to select image
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Max 5MB • JPG, PNG, WEBP
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handlePostImageSelect}
              />
            </label>

            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelPostImage}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUploadPostImage(showImageModal)}
                disabled={!selectedPostImage || uploadingPostId === showImageModal}
                className={`py-2 px-4 rounded transition ${
                  !selectedPostImage || uploadingPostId === showImageModal
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600"
                } text-white`}
              >
                {uploadingPostId === showImageModal ? "⏳ Uploading..." : "📤 Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4 z-50">
          <div className="bg-white shadow-2xl p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Change Password
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Old Password
                </label>
                <input
                  type="password"
                  placeholder="Enter old password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="border p-2 rounded w-full focus:border-orange-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Min 8 chars with uppercase, lowercase, numbers"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border p-2 rounded w-full focus:border-orange-400 focus:outline-none"
                />
                {newPassword && (
                  <p className="text-xs mt-1 text-gray-600">
                    {newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /[0-9]/.test(newPassword)
                      ? "✓ Strong password"
                      : "⚠ Needs: 8+ chars, uppercase, lowercase, number"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border p-2 rounded w-full focus:border-orange-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition"
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;