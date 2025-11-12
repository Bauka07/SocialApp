import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiHeart, FiMessageCircle, FiShare2, FiMoreVertical, FiBookmark, FiSend } from "react-icons/fi";

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
  likes_count?: number;
  comments_count?: number;
};

const Dashboard: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
  const [commentingOn, setCommentingOn] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");

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

  const toggleLike = (postId: number) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden animate-pulse">
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
              </div>
              <div className="w-full h-96 bg-gray-200" />
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent mb-2">
            Your Feed
          </h1>
          <p className="text-gray-600">Discover what's happening</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center border-2 border-orange-100">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-orange-500"
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-6">
              Be the first to share something amazing with the community!
            </p>
            <button 
              onClick={() => window.location.href = '/create-post'}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Create Your First Post
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
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
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleLike(post.id)}
                        className="group flex items-center gap-2 transition-all"
                      >
                        <FiHeart
                          className={`text-xl transition-all duration-300 ${
                            likedPosts.has(post.id)
                              ? "fill-red-500 text-red-500 scale-110"
                              : "text-gray-700 group-hover:text-red-500 group-hover:scale-110"
                          }`}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {likedPosts.has(post.id) ? "Liked" : "Like"}
                        </span>
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
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;