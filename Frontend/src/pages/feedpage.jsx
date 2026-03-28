import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../components/feedpage.css";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
  const [visibleComments, setVisibleComments] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [followingUsers, setFollowingUsers] = useState([]);

  const token = localStorage.getItem("token");
  const API_BASE = "http://localhost:3000/api";
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
    try {
      await axios.post(
        `${API_BASE}/createpost`,
        { text, image },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setText("");
      setImage("");
      fetchPosts();
    } catch (err) {
      console.error("Error creating post", err);
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
        <aside className="sidebar">
          <div className="user-profile-card">
            <div className="profile-avatar">
              {currentUser?.profilePic ? (
                <img src={currentUser.profilePic} alt={currentUser.name} className="avatar-img" />
              ) : (
                currentUser?.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <h3>Welcome back!</h3>
            <p className="user-stats">
              <span>
                📝 {posts.filter((p) => p.user?._id === currentUserId).length}{" "}
                Posts
              </span>
            </p>
          </div>
          <div className="sidebar-menu">
            <a href="/feedpage" className="menu-item active">
              <span className="menu-icon">🏠</span> Feed
            </a>
            <a href="/profile" className="menu-item">
              <span className="menu-icon">👤</span> Profile
            </a>
            <a href="#" className="menu-item">
              <span className="menu-icon">⚙️</span> Settings
            </a>
          </div>
        </aside>

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
              <button type="submit">📤 Post</button>
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
                          <img src={post.user.profilePic} alt={post.user.name} className="avatar-img" />
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
                    {post.user?._id !== currentUserId && (
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
                    <button className="action-btn">🔗</button>
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
                          <div key={idx} className="comment-row">
                            <div className="comment-avatar-small">
                              {c.user?.profilePic ? (
                                <img src={c.user.profilePic} alt={c.user.name} className="avatar-img" />
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
