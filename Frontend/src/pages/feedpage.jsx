import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../components/feedpage.css";
import API_BASE from "../api";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
  const [visibleComments, setVisibleComments] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [isPosting, setIsPosting] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    if (!token) {
      navigate("/");
      return;
    }
    fetchCurrentUser();
    fetchPosts();
  }, []);

  useEffect(() => {
    if (currentUserId && posts.length > 0) {
      // Update liked posts when currentUserId is available
      const liked = {};
      posts.forEach((post) => {
        liked[post._id] = post.likes.some((userId) => userId === currentUserId);
      });
      setLikedPosts(liked);
    }
  }, [currentUserId, posts]);

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(`${API_BASE}/userprofile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserId(res.data._id);
      setCurrentUser(res.data);
      setFollowingUsers(
        Array.isArray(res.data.following) ? res.data.following : [],
      );
      // Build savedPosts map from user data
      const savedMap = {};
      if (Array.isArray(res.data.savedPosts)) {
        res.data.savedPosts.forEach((id) => { savedMap[id] = true; });
      }
      setSavedPosts(savedMap);
    } catch (err) {
      console.error("Error fetching current user", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/");
      }
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/getposts`);
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts", err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (isPosting) return;
    setIsPosting(true);
    // parse @username tags from tagInput
    const taggedNames = tagInput
      .split(",")
      .map((t) => t.trim().replace(/^@/, ""))
      .filter(Boolean);
    try {
      await axios.post(
        `${API_BASE}/createpost`,
        { text, image, taggedNames },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setText("");
      setImage("");
      setTagInput("");
      fetchPosts();
    } catch (err) {
      console.error("Error creating post", err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await axios.put(
        `${API_BASE}/likepost/${postId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // Update local state for instant UI feedback
      setLikedPosts((prev) => ({
        ...prev,
        [postId]: res.data.liked,
      }));
      // Update the post likes array locally
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            if (res.data.liked) {
              return { ...post, likes: [...post.likes, currentUserId] };
            } else {
              return {
                ...post,
                likes: post.likes.filter((id) => id !== currentUserId),
              };
            }
          }
          return post;
        }),
      );
    } catch (err) {
      console.error("Error liking post", err.response?.data || err.message);
    }
  };

  const handleFollow = async (userId) => {
    try {
      console.log("Attempting to follow user:", userId);
      console.log("Token:", token);
      console.log("API URL:", `${API_BASE}/followuser/${userId}`);

      const res = await axios.post(
        `${API_BASE}/followuser/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log("Follow response:", res.data);

      if (res.data.following) {
        setFollowingUsers((prev) => [...prev, userId]);
      } else {
        setFollowingUsers((prev) => prev.filter((id) => id !== userId));
      }
    } catch (err) {
      console.error("Error following user:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error message:", err.message);

      if (err.response?.status === 401) {
        alert("Please login to follow users");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/");
      } else {
        alert(`Error: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const toggleComments = (postId) => {
    setVisibleComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleAddComment = async (postId) => {
    try {
      const commentText = commentInputs[postId]?.trim();
      if (!commentText) return;

      await axios.put(
        `${API_BASE}/commentpost/${postId}`,
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      fetchPosts(); // reload posts with updated comments
    } catch (err) {
      console.error("Error adding comment", err.response?.data || err.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_BASE}/deletepost/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error("Error deleting post", err);
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await axios.delete(`${API_BASE}/deletecomment/${postId}/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Remove the comment locally for instant UI update
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? { ...post, comments: post.comments.filter((c) => c._id !== commentId) }
            : post
        )
      );
    } catch (err) {
      console.error("Error deleting comment", err);
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSavePost = async (postId) => {
    try {
      const res = await axios.put(
        `${API_BASE}/savepost/${postId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSavedPosts((prev) => ({ ...prev, [postId]: res.data.saved }));
    } catch (err) {
      console.error("Error saving post", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="feed-container">
      <nav className="navbar">
        <h1 className="logo">SocialFeed</h1>
        <div className="nav-links">
          <a href="/feedpage">🏠 Home</a>
          <a href="/profile">👤 Profile</a>
          <button onClick={handleLogout}>🚪 Logout</button>
        </div>
      </nav>

      <div className="main-content">
        <main className="feed-main">
          <div className="create-post-card">
            <h3 className="card-title">Create a Post</h3>
            <form onSubmit={handleCreatePost}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What's on your mind?"
                required
                rows="3"
              />
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="🖼️ Image URL (optional)"
              />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="🏷️ Tag users by name, comma-separated (optional)"
              />
              <button type="submit" disabled={isPosting}>
                {isPosting ? "⏳ Posting…" : "📤 Post"}
              </button>
            </form>
          </div>

          <div className="posts-list">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post._id} className="post-card">
                  <div className="post-header">
                    <div className="post-author">
                      <div className="author-avatar">
                        {post.user?.profilePic ? (
                          <img
                            src={post.user.profilePic}
                            alt={post.user.name}
                            className="avatar-img"
                          />
                        ) : (
                          post.user?.name?.charAt(0).toUpperCase() || "A"
                        )}
                      </div>
                      <div className="author-info">
                        <p
                          className="post-user clickable-username"
                          onClick={() => navigate(`/profile/${post.user?._id}`)}
                        >
                          {post.user?.name || "Anonymous"}
                        </p>
                        <p className="post-time">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {post.user?._id !== currentUserId ? (
                      <button
                        className={
                          followingUsers.includes(post.user?._id)
                            ? "feed-unfollow-btn"
                            : "feed-follow-btn"
                        }
                        onClick={() => handleFollow(post.user?._id)}
                      >
                        {followingUsers.includes(post.user?._id)
                          ? "Following"
                          : "Follow"}
                      </button>
                    ) : (
                      <button
                        className="feed-delete-post-btn"
                        onClick={() => handleDeletePost(post._id)}
                        title="Delete post"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                  <p className="post-text">{post.text}</p>
                  {post.image && (
                    <img src={post.image} alt="Post" className="post-image" />
                  )}

                  <div className="post-actions">
                    <button
                      onClick={() => handleLikePost(post._id)}
                      className={`action-btn ${likedPosts[post._id] ? "liked" : ""}`}
                    >
                      {likedPosts[post._id] ? "❤️" : "🤍"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleComments(post._id)}
                      className="action-btn"
                    >
                      💬
                    </button>
                    <button
                      className={`action-btn ${savedPosts[post._id] ? "saved" : ""}`}
                      onClick={() => handleSavePost(post._id)}
                      title={savedPosts[post._id] ? "Unsave" : "Save"}
                    >
                      {savedPosts[post._id] ? "🔖" : "🏷️"}
                    </button>
                  </div>

                  <div className="post-stats">
                    <span className="stat-item">
                      {post.likes?.length || 0} likes
                    </span>
                  </div>

                  {/* Show last 2 comments preview */}
                  {post.comments &&
                    post.comments.length > 0 &&
                    !visibleComments[post._id] && (
                      <div className="comments-preview">
                        {post.comments.length > 2 && (
                          <span
                            className="view-all-comments"
                            onClick={() => toggleComments(post._id)}
                          >
                            View all {post.comments.length} comments
                          </span>
                        )}
                        {post.comments.slice(-2).map((c, idx) => (
                          <div key={idx} className="preview-comment">
                            <strong
                              className="preview-author clickable-username"
                              onClick={() =>
                                navigate(`/profile/${c.user?._id}`)
                              }
                            >
                              {c.user?.name || "Anonymous"}
                            </strong>
                            <span className="preview-text">{c.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Full comments section */}
                  {visibleComments[post._id] &&
                    post.comments &&
                    post.comments.length > 0 && (
                      <div className="comments-list-section">
                        {post.comments.map((c, idx) => (
                          <div key={c._id || idx} className="comment-row">
                            <div className="comment-avatar-small">
                              {c.user?.profilePic ? (
                                <img
                                  src={c.user.profilePic}
                                  alt={c.user.name}
                                  className="avatar-img"
                                />
                              ) : (
                                c.user?.name?.charAt(0).toUpperCase() || "A"
                              )}
                            </div>
                            <div className="comment-content-inline">
                              <strong
                                className="comment-author-inline clickable-username"
                                onClick={() =>
                                  navigate(`/profile/${c.user?._id}`)
                                }
                              >
                                {c.user?.name || "Anonymous"}
                              </strong>
                              <span className="comment-text-inline">
                                {c.text}
                              </span>
                            </div>
                            {c.user?._id === currentUserId && (
                              <button
                                className="delete-comment-btn"
                                onClick={() => handleDeleteComment(post._id, c._id)}
                                title="Delete comment"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Add comment input */}
                  <div className="add-comment-inline">
                    <input
                      type="text"
                      value={commentInputs[post._id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post._id]: e.target.value,
                        }))
                      }
                      placeholder="Add a comment..."
                      onKeyPress={(e) => {
                        if (
                          e.key === "Enter" &&
                          commentInputs[post._id]?.trim()
                        ) {
                          handleAddComment(post._id);
                        }
                      }}
                    />
                    {commentInputs[post._id]?.trim() && (
                      <button
                        onClick={() => handleAddComment(post._id)}
                        className="post-btn-inline"
                      >
                        Post
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-posts-card">
                <p className="no-posts">📭 No posts yet</p>
                <p className="no-posts-sub">Be the first to share something!</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
