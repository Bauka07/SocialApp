import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FiEdit3 } from "react-icons/fi"

interface Post {
  id: number;
  title: string;
  content: string;
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
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

  // Fetch user data
  useEffect(() => {
    if (!token) {
      toast.error("No token found");
      setLoading(false);
      navigate("/");
      return;
    }

    axios
      .get("http://localhost:8080/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data.user);
        setUsername(res.data.user.username);
        setEmail(res.data.user.email);
      })
      .catch((err) => {
        console.error("Profile load error:", err);
        toast.error("Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, [token, navigate]);

  // Handle profile update (with optional email verification)
  const handleUpdateProfile = async () => {
    try {
      const res = await axios.put(
        "http://localhost:8080/users/update",
        { username, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(res.data.user);
      toast.success("Profile updated successfully");

      if (res.data.email_verification_required) {
        toast.info("Please verify your new email address. Check your inbox!");
      }
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedImage) return toast.warn("Please select an image first");

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const res = await axios.post(
        "http://localhost:8080/users/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Profile image updated");
      setUser((prev) =>
        prev ? { ...prev, image_url: res.data.image_url } : prev
      );
    } catch {
      toast.error("Image upload failed");
    }
  };

  // Handle password change with confirm check
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.warn("Please fill all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      await axios.put(
        "http://localhost:8080/users/password",
        { old_password: oldPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Password updated successfully");
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password");
    }
  };

  // Handle create post
  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.warn("Title and content are required");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:8080/users/posts",
        newPost,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Post added!");
      setUser((prev) =>
        prev ? { ...prev, posts: [res.data.post, ...prev.posts] } : prev
      );
      setNewPost({ title: "", content: "" });
    } catch {
      toast.error("Failed to add post");
    }
  };

  // Handle delete post
  const handleDeletePost = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8080/users/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Post deleted");
      setUser((prev) =>
        prev ? { ...prev, posts: prev.posts.filter((p) => p.id !== id) } : prev
      );
    } catch {
      toast.error("Failed to delete post");
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-600">Loading profile...</p>;
  if (!user)
    return <p className="text-center mt-10 text-gray-600">No profile found</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      {/* Profile Section */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center md:text-left">
        My Profile
      </h1>

      <div className="bg-white shadow-[0_5px_15px_rgba(0,0,0,0.35)] p-6 rounded-xl mb-6">
        {/* Profile Image + Upload */}
        <div className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0">
          <img
            src={
              user.image_url
                ? `http://localhost:8080/${user.image_url}`
                : "/default-avatar.png"
            }
            alt="profile"
            className="w-24 h-24 bg-gray-200 rounded-full border object-cover"
          />

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <input
              className="border px-3 py-2 rounded w-full sm:w-60 cursor-pointer"
              type="file"
              onChange={(e) =>
                setSelectedImage(e.target.files ? e.target.files[0] : null)
              }
            />
            <button
              onClick={handleImageUpload}
              className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded w-full sm:w-auto"
            >
              Upload
            </button>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="mt-6 space-y-6">
          {/* Username Field */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Username</label>
            <div className="flex items-center gap-2">
              <input
                ref={usernameRef}
                type="text"
                value={username}
                readOnly={!editingUsername}
                onChange={(e) => setUsername(e.target.value)}
                className={`border p-2 rounded w-full ${
                  editingUsername ? "bg-white" : "bg-gray-100 cursor-not-allowed"
                }`}
              />
              {editingUsername ? (
                <button
                  onClick={() => {
                    handleUpdateProfile();
                    setEditingUsername(false);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded"
                >
                  Save
                </button>
              ) : (
                <FiEdit3
                  className="w-5 h-5 text-gray-600 cursor-pointer hover:text-orange-500 transition"
                  onClick={() => {
                    setUsername("");
                    setEditingUsername(true);
                    setTimeout(() => usernameRef.current?.focus(), 0);
                  }}
                />
              )}
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <div className="flex items-center gap-2">
              <input
                ref={emailRef}
                type="email"
                value={email}
                readOnly={!editingEmail}
                onChange={(e) => setEmail(e.target.value)}
                className={`border p-2 rounded w-full ${
                  editingEmail ? "bg-white" : "bg-gray-100 cursor-not-allowed"
                }`}
              />
              {editingEmail ? (
                <button
                  onClick={() => {
                    handleUpdateProfile();
                    setEditingEmail(false);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded"
                >
                  Save
                </button>
              ) : (
                <FiEdit3
                  className="w-5 h-5 text-gray-600 cursor-pointer hover:text-orange-500 transition"
                  onClick={() => {
                    setEmail("");
                    setEditingEmail(true);
                    setTimeout(() => emailRef.current?.focus(), 0);
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Change Password Button */}
        <div className="flex justify-start mt-6">
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
      <div className="bg-white shadow-[0_5px_15px_rgba(0,0,0,0.35)] p-4 rounded-xl mb-6">
        <h4 className="text-lg font-semibold mb-3">Add New Post</h4>
        <input
          placeholder="Post title"
          value={newPost.title}
          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          className="border p-2 rounded w-full mb-2"
        />
        <textarea
          placeholder="Post content"
          value={newPost.content}
          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          rows={5}
          className="border p-2 rounded w-full mb-2 resize-none"
        />
        <button
          onClick={handleCreatePost}
          className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded"
        >
          Add Post
        </button>
      </div>

      {/* Show posts */}
      <div className="grid gap-4">
        {user.posts.length > 0 ? (
          user.posts.map((post) => (
            <div key={post.id} className="bg-white p-4 rounded-lg shadow">
              <h4 className="text-lg font-semibold text-orange-600">
                {post.title}
              </h4>
              <p className="text-gray-700 mt-2">{post.content}</p>
              <button
                onClick={() => handleDeletePost(post.id)}
                className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No posts yet.</p>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4 z-50 transition-opacity animate-fadeIn">
          <div className="bg-white shadow-[0_5px_15px_rgba(0,0,0,0.35)] p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Change Password
            </h2>

            <input
              type="password"
              placeholder="Old password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="border p-2 rounded w-full mb-2"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border p-2 rounded w-full mb-2"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border p-2 rounded w-full mb-4"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;