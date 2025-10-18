import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

type Post = {
  id: number;
  title: string;
  content: string;
  author?: string;
};

const Dashboard: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("http://localhost:8080/users/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setPosts(res.data.posts || []);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load posts.");
      });
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      
      <main className={`flex-1 p-8 ml-0 transition-all duration-300 ${
        sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

        {error && <p className="text-red-500">{error}</p>}

        {posts.length === 0 ? (
          <p className="text-gray-600">No posts yet.</p>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold text-blue-600">
                  {post.title}
                </h2>
                <p className="text-gray-700 mt-2">{post.content}</p>
                {post.author && (
                  <p className="text-sm text-gray-500 mt-1">by {post.author}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;