import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom";

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
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const navigate = useNavigate()
  const token = localStorage.getItem("token");

  // Fetch user data
  useEffect(() => {
    if (!token) {
      toast.error("No token found");
      setLoading(false);
      navigate("/")
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
  }, [token]);

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      const res = await axios.put(
        "http://localhost:8080/users/update",
        { username, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Profile updated");
      setUser(res.data.user);
    } catch {
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
      setUser((prev) => (prev ? { ...prev, image_url: res.data.image_url } : prev));
    } catch {
      toast.error("Image upload failed");
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    try {
      await axios.put(
        "http://localhost:8080/users/password",
        { old_password: oldPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Password updated");
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
    } catch {
      toast.error("Failed to change password");
    }
  };

  // Handle create post
  const handleCreatePost = async () => {
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

  if (loading) return <p className="text-center mt-10">Loading profile...</p>;
  if (!user) return <p className="text-center mt-10">No profile found</p>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8 ml-0 md:ml-64 transition-all duration-300">
        {/* Profile Section */}
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>

        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <div className="flex items-center space-x-6">
            <img
              src={
                user.image_url
                  ? `http://localhost:8080/${user.image_url}`
                  : "/default-avatar.png"
              }
              alt=""
              className="w-24 h-24 bg-gray-700 rounded-full border"
            />
            <div className="flex items-center justify-between">
              <input
                className="border px-3 rounded py-1 cursor-pointer w-2/4"
                type="file"
                onChange={(e) =>
                  setSelectedImage(e.target.files ? e.target.files[0] : null)
                }
              />
              <button
                onClick={handleImageUpload}
                className=" bg-orange-500 cursor-pointer hover:bg-orange-600 text-white py-1 px-3 rounded"
              >
                Upload
              </button>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-gray-700">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border p-2 rounded w-full mb-4"
            />

            <label className="block text-gray-700">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 rounded w-full mb-4"
            />

            <div className="flex flex-col sm:flex-row flex-wrap  gap-7 ">
              <Button
                  variant="default"
                  onClick={handleUpdateProfile}
                  className=" py-5 px-6"
              >
                  Save Changes
              </Button>

              <Button
                  variant="default"
                  onClick={() => setShowPasswordModal(true)}
                  className="bg-gray-700 hover:bg-gray-800 text-white py-5 px-6"
              >
                  Change Password
              </Button>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <h3 className="text-2xl font-bold mb-4 text-gray-800">My Posts</h3>

        {/* Add new post */}
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <h4 className="text-lg font-semibold mb-2">Add New Post</h4>
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
            <p>No posts yet.</p>
          )}
        </div>
      </main>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
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
