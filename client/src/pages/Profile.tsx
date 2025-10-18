import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { toast } from "react-toastify";

interface User {
  id: number;
  username: string;
  email: string;
  posts: { id: number; title: string; content: string }[];
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
        toast.error("No token found");
        setLoading(false);
        return;
    }
    axios
      .get("http://localhost:8080/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data.user))
      .catch((err) => {
            console.error("Profile load error:", err.response?.data || err.message);
            toast.error("Failed to load profile");
        })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center mt-10">Loading profile...</p>;
  if (!user) return <p className="text-center mt-10">No profile found</p>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8 ml-0 md:ml-64 transition-all duration-300">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>

        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h2 className="text-xl font-semibold text-orange-500 mb-2">
            {user.username}
          </h2>
          <p className="text-gray-700">{user.email}</p>
        </div>

        <h3 className="text-2xl font-bold mb-4 text-gray-800">My Posts</h3>
        <div className="grid gap-4">
          {user.posts.length > 0 ? (
            user.posts.map((post) => (
              <div key={post.id} className="bg-white p-4 rounded-lg shadow">
                <h4 className="text-lg font-semibold text-orange-600">{post.title}</h4>
                <p className="text-gray-700 mt-2">{post.content}</p>
              </div>
            ))
          ) : (
            <p>No posts yet.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
