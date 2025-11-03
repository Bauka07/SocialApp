import React, { useEffect, useState } from "react";
import axios from "axios";

type Post = {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  user_id: number;
  user: {
    id: number;
    username: string;
    email: string;
    image_url?: string;
  };
};

const Dashboard: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("http://26.176.162.130:8080/posts", {
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
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <p className="text-gray-600">Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {error && <p className="text-red-500">{error}</p>}

      {posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-600 text-lg font-medium">No posts yet</p>
          <p className="text-gray-400 mt-2 text-sm">
            Start by creating your first post to fill up the dashboard!
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-xl shadow-md">
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}
              <h2 className="text-xl font-semibold text-orange-400">
                {post.title}
              </h2>
              <p className="text-gray-700 mt-2">{post.content}</p>
              
              <div className="flex items-center gap-3 mt-4">
                {post.user?.image_url && (
                  <img
                    src={post.user.image_url}
                    alt={post.user?.username || "User"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <p className="text-sm text-gray-500">
                  by {post.user?.username || "Unknown User"}
                </p>
                <p className="text-xs text-gray-400">
                  • {new Date(post.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;