import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FiEdit3, FiUser, FiMail, FiLock, FiCamera, FiUpload, FiTrash2, FiAlertTriangle, FiLogOut, FiShield } from "react-icons/fi";

interface User {
  id: number;
  username: string;
  email: string;
  image_url?: string;
}

const Settings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  
  // Profile editing states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  
  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

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

        setUser(userRes.data.user);
        setUsername(userRes.data.user.username);
        setEmail(userRes.data.user.email);
      } catch (err) {
        console.error("Settings load error:", err);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate]);

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
        setUser(res.data.user);
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
      setUser((prev) => prev ? { ...prev, image_url: res.data.image_url } : prev);
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

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.warn("Please fill all password fields");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
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

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event('auth-change'));
      navigate("/");
      toast.success("Logged out successfully");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <p className="text-center mt-10 text-gray-600">No user found</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent mb-2">
            Account Settings
          </h1>
          <p className="text-gray-600 text-lg">Manage your account preferences and security</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-xl mb-8 p-2 inline-flex gap-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-4 px-8 rounded-xl font-bold transition-all flex items-center gap-3 ${
              activeTab === "profile"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FiUser className="w-5 h-5" />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`py-4 px-8 rounded-xl font-bold transition-all flex items-center gap-3 ${
              activeTab === "security"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FiShield className="w-5 h-5" />
            Security & Privacy
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiUser className="text-orange-500" />
              Profile Information
            </h2>

            {/* Profile Image - ROUNDED */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-orange-100 shadow-lg">
                  {imagePreview || user.image_url ? (
                    <img
                      src={imagePreview || user.image_url}
                      alt="profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <span className="text-white text-4xl font-bold">
                        {user.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <FiCamera className="text-white text-3xl" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              </div>

              {selectedImage && (
                <button
                  onClick={handleImageUpload}
                  disabled={uploading}
                  className={`px-6 py-3 rounded-xl transition font-semibold flex items-center gap-2 ${
                    uploading 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg"
                  } text-white`}
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload />
                      Save Photo
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Username */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <div className="flex gap-2">
                <input
                  ref={usernameRef}
                  type="text"
                  value={username}
                  readOnly={!editingUsername}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`border-2 p-3 rounded-xl w-full transition-all ${
                    editingUsername ? "border-orange-400 bg-white" : "bg-gray-50 border-gray-200"
                  }`}
                />
                {editingUsername ? (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await handleUpdateProfile();
                        setEditingUsername(false);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 rounded-xl transition"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setUsername(user.username);
                        setEditingUsername(false);
                      }}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-4 rounded-xl transition"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingUsername(true)}
                    className="p-3 hover:bg-orange-100 rounded-xl transition"
                  >
                    <FiEdit3 className="text-orange-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="flex gap-2">
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  readOnly={!editingEmail}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`border-2 p-3 rounded-xl w-full transition-all ${
                    editingEmail ? "border-orange-400 bg-white" : "bg-gray-50 border-gray-200"
                  }`}
                />
                {editingEmail ? (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await handleUpdateProfile();
                        setEditingEmail(false);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 rounded-xl transition"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setEmail(user.email);
                        setEditingEmail(false);
                      }}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-4 rounded-xl transition"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingEmail(true)}
                    className="p-3 hover:bg-orange-100 rounded-xl transition"
                  >
                    <FiEdit3 className="text-orange-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Change Password */}
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-b border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-500 p-3 rounded-xl shadow-lg">
                    <FiLock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl">Password</h3>
                </div>
                <p className="text-gray-600 text-sm">Keep your account secure with a strong password</p>
              </div>
              <div className="p-6">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-xl transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 w-full"
                >
                  <FiLock className="w-5 h-5" />
                  Change Password
                </button>
              </div>
            </div>

            {/* Logout */}
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 border-b border-orange-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-orange-500 p-3 rounded-xl shadow-lg">
                    <FiLogOut className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl">Sign Out</h3>
                </div>
                <p className="text-gray-600 text-sm">End your session safely</p>
              </div>
              <div className="p-6">
                <button
                  onClick={handleLogout}
                  className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-xl transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 w-full"
                >
                  <FiLogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 z-50">
          <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FiLock />
                Change Password
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="border-2 border-gray-300 p-3 rounded-xl w-full focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border-2 border-gray-300 p-3 rounded-xl w-full focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-2 border-gray-300 p-3 rounded-xl w-full focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl transition font-semibold shadow-lg"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;