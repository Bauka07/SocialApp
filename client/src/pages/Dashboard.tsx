import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import { FiHeart, FiMessageCircle, FiSend, FiTrash2, FiEdit2, FiShare2, FiX } from "react-icons/fi";

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
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
};

type Comment = {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  user: {
    id: number;
    username: string;
    image_url?: string;
  };
};

interface PostCardProps {
  post: Post;
  onLike: (postId: number) => void;
  onShare: (postId: number) => void;
  isLiking: boolean;
  showComments: boolean;
  comments?: Comment[];
  onToggleComments: (postId: number) => void;
  currentUserId: number | null;
  commentText: string;
  onCommentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCommentSubmit: (postId: number) => void;
  onEditComment: (commentId: number, content: string) => void;
  onUpdateComment: (commentId: number, postId: number) => void;
  onDeleteComment: (commentId: number, postId: number) => void;
  editingCommentId: number | null;
  editCommentText: string;
  onEditCommentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancelEdit: () => void;
  formatTimeAgo: (date: string) => string;
}

const API_URL = "http://26.176.162.130:8080";

// Memoized PostCard component for performance
const PostCard = memo<PostCardProps>(({ 
  post, 
  onLike, 
  onShare,
  isLiking,
  showComments,
  comments,
  onToggleComments,
  currentUserId,
  commentText,
  onCommentChange,
  onCommentSubmit,
  onEditComment,
  onUpdateComment,
  onDeleteComment,
  editingCommentId,
  editCommentText,
  onEditCommentChange,
  onCancelEdit,
  formatTimeAgo
}) => {
  return (
    <article className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
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
            <p className="font-semibold text-gray-900 text-sm">{post.user?.username || "Unknown User"}</p>
            <p className="text-xs text-gray-500">{formatTimeAgo(post.created_at)}</p>
          </div>
        </div>
      </div>

      {post.image_url && (
        <div className="relative w-full bg-gray-100">
          <img 
            src={post.image_url} 
            alt={post.title} 
            className="w-full max-h-[600px] object-contain" 
            loading="lazy"
            onError={(e) => (e.currentTarget.style.display = "none")} 
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onLike(post.id)} 
              disabled={isLiking}
              className="group flex items-center gap-2 transition-all disabled:opacity-70 active:scale-95"
            >
              <FiHeart 
                className={`text-2xl transition-all duration-200 ${
                  post.is_liked 
                    ? "fill-red-500 stroke-red-500" 
                    : "stroke-gray-700 group-hover:stroke-red-400"
                } ${isLiking ? "animate-pulse" : ""}`}
                strokeWidth={post.is_liked ? 0 : 2} 
              />
              <span className={`text-sm font-semibold ${post.is_liked ? "text-red-500" : "text-gray-700"}`}>
                {post.likes_count || 0}
              </span>
            </button>
            
            <button 
              onClick={() => onToggleComments(post.id)}
              className="group flex items-center gap-2 transition-all active:scale-95"
            >
              <FiMessageCircle className="text-2xl text-gray-700 group-hover:text-blue-500 transition-all" />
              <span className="text-sm font-semibold text-gray-700">{post.comments_count || 0}</span>
            </button>
            
            <button 
              onClick={() => onShare(post.id)}
              className="group flex items-center gap-2 transition-all active:scale-95"
            >
              <FiShare2 className="text-2xl text-gray-700 group-hover:text-green-500 transition-all" />
            </button>
          </div>
        </div>

        {post.title && <h2 className="text-lg font-bold text-gray-900 mb-1">{post.title}</h2>}
        <p className="text-gray-700 leading-relaxed">
          <span className="font-semibold text-gray-900">{post.user?.username}</span> {post.content}
        </p>

        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={commentText} 
                onChange={onCommentChange}
                placeholder="Add a comment..." 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" 
                onKeyPress={(e) => e.key === "Enter" && commentText.trim() && onCommentSubmit(post.id)}
              />
              <button 
                onClick={() => onCommentSubmit(post.id)}
                disabled={!commentText.trim()}
                className={`px-4 py-2 rounded-xl transition ${
                  commentText.trim() 
                    ? "bg-orange-500 hover:bg-orange-600 text-white" 
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                <FiSend className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments?.map((comment: Comment) => (
                <div key={comment.id} className="flex gap-3 bg-gray-50 p-3 rounded-xl">
                  {comment.user?.image_url ? (
                    <img 
                      src={comment.user.image_url} 
                      alt={comment.user.username} 
                      className="w-8 h-8 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {comment.user?.username?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">{comment.user?.username}</span>
                        <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                      </div>
                      {currentUserId === comment.user_id && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => onEditComment(comment.id, comment.content)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onDeleteComment(comment.id, post.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="flex gap-2 mt-2">
                        <input 
                          type="text" 
                          value={editCommentText}
                          onChange={onEditCommentChange}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" 
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && editCommentText.trim()) 
                              onUpdateComment(comment.id, post.id);
                            if (e.key === "Escape") onCancelEdit();
                          }}
                        />
                        <button 
                          onClick={() => onUpdateComment(comment.id, post.id)}
                          disabled={!editCommentText.trim()}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button 
                          onClick={onCancelEdit}
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
  );
});

PostCard.displayName = "PostCard";

const Dashboard: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [commentingOn, setCommentingOn] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({});
  const [showComments, setShowComments] = useState<{ [key: number]: boolean }>({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [showShareModal, setShowShareModal] = useState<number | null>(null);
  const [likingPosts, setLikingPosts] = useState<Set<number>>(new Set());
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const pendingLikes = useRef<Map<number, AbortController>>(new Map());
  const isLoadingMore = useRef(false);
  const pageRef = useRef(0); // Use ref to avoid recreating loadMorePosts

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchInitialPosts();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCurrentUserId(data.user.id);
    } catch (err) {
      console.error("Failed to fetch current user:", err);
    }
  };

  const fetchInitialPosts = async () => {
    try {
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/posts?page=0&page_size=10`, { headers });
      const data = await res.json();
      
      console.log("Initial posts loaded:", {
        count: data.posts?.length,
        hasMore: data.has_more,
        page: data.page
      });
      
      setPosts(data.posts || []);
      setHasMore(data.has_more || false);
      setPage(0);
      pageRef.current = 0; // Initialize ref
    } catch (err) {
      console.error(err);
      setError("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore.current || !hasMore) {
      console.log("Skipping load:", { isLoading: isLoadingMore.current, hasMore });
      return;
    }
    
    isLoadingMore.current = true;
    setLoadingMore(true);
    
    const nextPage = pageRef.current + 1; // Use ref instead of state
    console.log("Loading page:", nextPage, "Current page ref:", pageRef.current);

    try {
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/posts?page=${nextPage}&page_size=10`, { headers });
      const data = await res.json();
      
      console.log("Received:", {
        postsCount: data.posts?.length,
        hasMore: data.has_more,
        requestedPage: nextPage
      });
      
      if (data.posts && data.posts.length > 0) {
        setPosts((prev: Post[]) => {
          const existingIds = new Set(prev.map((p: Post) => p.id));
          const newPosts = data.posts.filter((p: Post) => !existingIds.has(p.id));
          console.log("Adding new posts:", newPosts.length, "Total will be:", prev.length + newPosts.length);
          return [...prev, ...newPosts];
        });
        
        pageRef.current = nextPage; // Update ref
        setPage(nextPage); // Update state for display
        setHasMore(data.has_more || false);
      } else {
        console.log("No posts returned, setting hasMore to false");
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more posts:", err);
    } finally {
      setLoadingMore(false);
      isLoadingMore.current = false;
    }
  }, [hasMore, token]); // Removed 'page' dependency - using pageRef instead

  // FIXED: Infinite scroll observer - properly managed
  useEffect(() => {
    // Don't set up observer during initial load or if no more posts
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore.current && hasMore) {
          console.log("Intersection triggered - loading more posts");
          loadMorePosts();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
      console.log("Observer attached to target");
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loading, hasMore, loadMorePosts]); // Track all dependencies

  const toggleLike = useCallback(async (postId: number) => {
    if (!token) {
      alert("Please login to like posts");
      return;
    }

    if (pendingLikes.current.has(postId)) {
      pendingLikes.current.get(postId)?.abort();
      pendingLikes.current.delete(postId);
    }

    if (likingPosts.has(postId)) return;

    setLikingPosts((prev) => new Set(prev).add(postId));

    const currentPost = posts.find((p: Post) => p.id === postId);
    if (!currentPost) return;

    const optimisticIsLiked = !currentPost.is_liked;
    const optimisticCount = optimisticIsLiked 
      ? currentPost.likes_count + 1 
      : Math.max(0, currentPost.likes_count - 1);

    setPosts((prev) =>
      prev.map((post: Post) =>
        post.id === postId
          ? { ...post, is_liked: optimisticIsLiked, likes_count: optimisticCount }
          : post
      )
    );

    const abortController = new AbortController();
    pendingLikes.current.set(postId, abortController);

    try {
      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        signal: abortController.signal,
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();

      setPosts((prev) =>
        prev.map((post: Post) =>
          post.id === postId
            ? { ...post, is_liked: data.liked, likes_count: data.likes_count }
            : post
        )
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Like error:", err);
        setPosts((prev) =>
          prev.map((post: Post) =>
            post.id === postId
              ? { ...post, is_liked: currentPost.is_liked, likes_count: currentPost.likes_count }
              : post
          )
        );
        if (err.message.includes("401")) {
          alert("Session expired. Please login again.");
        }
      }
    } finally {
      pendingLikes.current.delete(postId);
      setTimeout(() => {
        setLikingPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }, 300);
    }
  }, [token, posts, likingPosts]);

  const fetchComments = async (postId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setComments((prev) => ({ ...prev, [postId]: data.comments || [] }));
    } catch (err) {
      console.error("Fetch comments error:", err);
    }
  };

  const handleCommentSubmit = async (postId: number) => {
    if (!token || !commentText.trim()) return;
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: commentText }),
      });
      const data = await res.json();
      setComments((prev) => ({
        ...prev,
        [postId]: [data.comment, ...(prev[postId] || [])],
      }));
      setPosts((prev) =>
        prev.map((post: Post) =>
          post.id === postId
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );
      setCommentText("");
      setCommentingOn(null);
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  const handleEditComment = (commentId: number, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditCommentText(currentContent);
  };

  const handleUpdateComment = async (commentId: number, postId: number) => {
    if (!token || !editCommentText.trim()) return;
    try {
      const res = await fetch(`${API_URL}/comments/${commentId}`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: editCommentText }),
      });
      const data = await res.json();
      setComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((c: Comment) =>
          c.id === commentId ? { ...c, content: data.comment.content } : c
        ),
      }));
      setEditingCommentId(null);
      setEditCommentText("");
    } catch (err) {
      console.error("Update comment error:", err);
    }
  };

  const handleDeleteComment = async (commentId: number, postId: number) => {
    if (!token || !confirm("Delete this comment?")) return;
    try {
      await fetch(`${API_URL}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c: Comment) => c.id !== commentId),
      }));
      setPosts((prev) =>
        prev.map((post: Post) =>
          post.id === postId
            ? { ...post, comments_count: Math.max(0, post.comments_count - 1) }
            : post
        )
      );
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  };

  const toggleComments = async (postId: number) => {
    if (!showComments[postId]) {
      await fetchComments(postId);
    }
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, []);

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
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent mb-2">
            Your Feed
          </h1>
          <p className="text-gray-600">Trending posts and latest updates</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center border-2 border-orange-100">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600">Be the first to share something!</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {posts.map((post: Post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={toggleLike}
                  isLiking={likingPosts.has(post.id)}
                  showComments={showComments[post.id]}
                  comments={comments[post.id]}
                  onToggleComments={toggleComments}
                  currentUserId={currentUserId}
                  commentText={commentingOn === post.id ? commentText : ""}
                  onCommentChange={(e) => {
                    setCommentingOn(post.id);
                    setCommentText(e.target.value);
                  }}
                  onCommentSubmit={handleCommentSubmit}
                  onEditComment={handleEditComment}
                  onUpdateComment={handleUpdateComment}
                  onDeleteComment={handleDeleteComment}
                  onShare={setShowShareModal}
                  editingCommentId={editingCommentId}
                  editCommentText={editCommentText}
                  onEditCommentChange={(e) => setEditCommentText(e.target.value)}
                  onCancelEdit={() => {
                    setEditingCommentId(null);
                    setEditCommentText("");
                  }}
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
            </div>

            {hasMore && (
              <div ref={observerTarget} className="flex justify-center py-8">
                {loadingMore ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600 text-sm">Loading more posts...</p>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">Scroll for more</div>
                )}
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">You've reached the end!</p>
              </div>
            )}
          </>
        )}

        {showShareModal !== null && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 z-50">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Share Post</h3>
                <button onClick={() => setShowShareModal(null)} className="text-gray-500 hover:text-gray-700">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
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
                  className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;