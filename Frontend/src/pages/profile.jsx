import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../components/profile.css";
import API_BASE from "../api";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [taggedPosts, setTaggedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts"); // "posts" | "saved" | "tagged"
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Modals
  const [isEditing, setIsEditing] = useState(false);
  const [isSettings, setIsSettings] = useState(false);

  const [editForm, setEditForm] = useState({ name: "", bio: "", profilePic: "" });

  // Settings form state
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const { userId: profileUserId } = useParams();
  const token = localStorage.getItem("token");
  const loggedInUserId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const userIdToShow = profileUserId || loggedInUserId;
  const isOwnProfile = userIdToShow === loggedInUserId;

  useEffect(() => {
    if (!token || !loggedInUserId) {
      navigate("/");
      return;
    }
    fetchCurrentUser();
  }, [loggedInUserId]);

  useEffect(() => {
    if (userIdToShow) {
      fetchUserProfile();
      fetchUserPosts();
      if (isOwnProfile) {
        fetchSavedPosts();
      }
      fetchTaggedPosts();
    }
  }, [userIdToShow]);

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(`${API_BASE}/userprofile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserId(res.data._id);
      if (userIdToShow && res.data.following) {
        setIsFollowing(res.data.following.includes(userIdToShow));
      }
    } catch (err) {
      console.error("Error fetching current user", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/");
      }
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}/getprofile/${userIdToShow}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser({
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        bio: res.data.bio || "",
        profilePic: res.data.profilePic || "",
        followers: res.data.followers || [],
        following: res.data.following || [],
      });
      setEditForm({
        name: res.data.name,
        bio: res.data.bio || "",
        profilePic: res.data.profilePic || "",
      });
      if (currentUserId && res.data.followers) {
        setIsFollowing(res.data.followers.includes(currentUserId));
      }
    } catch (err) {
      console.error("Error fetching profile", err);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/getuserpost/${userIdToShow}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts", err);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/getsavedposts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedPosts(res.data);
    } catch (err) {
      console.error("Error fetching saved posts", err);
    }
  };

  const fetchTaggedPosts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/gettaggedposts/${userIdToShow}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTaggedPosts(res.data);
    } catch (err) {
      console.error("Error fetching tagged posts", err);
    }
  };

  const handleFollow = async () => {
    try {
      const res = await axios.post(
        `${API_BASE}/followuser/${userIdToShow}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIsFollowing(res.data.following);
      setUser((prev) => ({
        ...prev,
        followers: res.data.following
          ? [...(prev.followers || []), currentUserId]
          : (prev.followers || []).filter((id) => id !== currentUserId),
      }));
    } catch (err) {
      console.error("Error following/unfollowing user", err);
      if (err.response?.status === 401) {
        alert("Please login to follow users");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "/";
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({ name: user.name, bio: user.bio, profilePic: user.profilePic });
  };

  const handleSaveProfile = async () => {
    try {
      const res = await axios.put(`${API_BASE}/updateprofile`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile", err);
      alert(`Error: ${err.response?.data?.message || err.message}`);
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

  // ── Settings handlers ────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    try {
      await axios.put(
        `${API_BASE}/changepassword`,
        { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setPwSuccess("Password changed successfully!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwError(err.response?.data?.message || "Failed to change password.");
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError("");
    if (!window.confirm("Are you absolutely sure? This will permanently delete your account and all your posts.")) return;
    try {
      await axios.delete(`${API_BASE}/deleteaccount`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: deletePassword },
      });
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "/";
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete account.");
    }
  };

  // ── Render helpers ───────────────────────────────────────────────────────
  const renderGrid = (gridPosts, emptyIcon, emptyTitle, emptyMsg, showDelete = false) => {
    if (gridPosts.length === 0) {
      return (
        <div className="no-posts-message">
          <div className="no-posts-icon">{emptyIcon}</div>
          <h3>{emptyTitle}</h3>
          <p>{emptyMsg}</p>
          {activeTab === "posts" && (
            <a href="/feedpage" className="share-first-post">Share your first post</a>
          )}
        </div>
      );
    }
    return gridPosts.map((post) => (
      <div key={post._id} className="profile-post-card">
        {post.image ? (
          <img className="profile-post-image" src={post.image} alt="Post" />
        ) : (
          <div className="profile-post-text-only"><p>{post.text}</p></div>
        )}
        <div className="post-overlay">
          <span className="overlay-stat">❤️ {post.likes?.length || 0}</span>
          <span className="overlay-stat">💬 {post.comments?.length || 0}</span>
          {showDelete && (
            <button
              className="profile-delete-post-btn"
              onClick={(e) => { e.stopPropagation(); handleDeletePost(post._id); }}
              title="Delete post"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    ));
  };

  if (!user) return <p>Loading profile...</p>;

  const activeGridPosts =
    activeTab === "posts" ? posts :
    activeTab === "saved" ? savedPosts :
    taggedPosts;

  return (
    <div className="profile-container">
      <nav className="navbar">
        <h1 className="logo">SocialFeed</h1>
        <div className="nav-links">
          <a href="/feedpage">🏠 Home</a>
          <button onClick={handleLogout}>🚪 Logout</button>
        </div>
      </nav>

      <div className="profile-content">
        {/* ── Header ── */}
        <div className="profile-header-section">
          <div className="profile-avatar-large">
            {user.profilePic ? (
              <img src={user.profilePic} alt={user.name} className="profile-pic-img" />
            ) : (
              user.name?.charAt(0).toUpperCase() || "U"
            )}
          </div>

          <div className="profile-info">
            <div className="profile-username-row">
              <h2 className="profile-username">{user.name}</h2>
              {isOwnProfile ? (
                <>
                  <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </button>
                  <button className="settings-btn" onClick={() => setIsSettings(true)} title="Settings">⚙️</button>
                </>
              ) : (
                <button
                  className={isFollowing ? "unfollow-btn" : "follow-btn"}
                  onClick={handleFollow}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-number">{posts.length}</span>
                <span className="stat-label">posts</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{user.followers?.length || 0}</span>
                <span className="stat-label">followers</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{user.following?.length || 0}</span>
                <span className="stat-label">following</span>
              </div>
            </div>

            <div className="profile-bio-section">
              <p className="profile-fullname">{user.name}</p>
              <p className="profile-bio-text">{user.bio || "No bio yet"}</p>
              <p className="profile-email">📧 {user.email}</p>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            <span className="tab-icon">📱</span> POSTS
          </button>
          {isOwnProfile && (
            <button
              className={`tab-btn ${activeTab === "saved" ? "active" : ""}`}
              onClick={() => { setActiveTab("saved"); fetchSavedPosts(); }}
            >
              <span className="tab-icon">🔖</span> SAVED
            </button>
          )}
          <button
            className={`tab-btn ${activeTab === "tagged" ? "active" : ""}`}
            onClick={() => { setActiveTab("tagged"); fetchTaggedPosts(); }}
          >
            <span className="tab-icon">🏷️</span> TAGGED
          </button>
        </div>

        {/* ── Grid ── */}
        <div className="profile-posts-grid">
          {activeTab === "saved" && !isOwnProfile ? (
            <div className="no-posts-message">
              <div className="no-posts-icon">🔒</div>
              <h3>Private</h3>
              <p>Only the account owner can see saved posts.</p>
            </div>
          ) : (
            renderGrid(
              activeGridPosts,
              activeTab === "posts" ? "📷" : activeTab === "saved" ? "🔖" : "🏷️",
              activeTab === "posts" ? "No Posts Yet" : activeTab === "saved" ? "No Saved Posts" : "Not Tagged Yet",
              activeTab === "posts"
                ? "When you share photos and videos, they'll appear on your profile."
                : activeTab === "saved"
                ? "Posts you save will appear here."
                : "Posts you're tagged in will appear here.",
              activeTab === "posts" && isOwnProfile
            )
          )}
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      {isEditing && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="modal-close" onClick={handleCancelEdit}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>Profile Picture URL</label>
                <input
                  type="text"
                  value={editForm.profilePic}
                  onChange={(e) => setEditForm({ ...editForm, profilePic: e.target.value })}
                  placeholder="https://example.com/profile.jpg"
                />
                {editForm.profilePic && (
                  <div className="profile-pic-preview">
                    <img src={editForm.profilePic} alt="Preview" />
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCancelEdit}>Cancel</button>
              <button className="btn-save" onClick={handleSaveProfile}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Settings Modal ── */}
      {isSettings && (
        <div className="modal-overlay" onClick={() => setIsSettings(false)}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚙️ Settings</h2>
              <button className="modal-close" onClick={() => setIsSettings(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Change Password */}
              <div className="settings-section">
                <h3 className="settings-section-title">🔐 Change Password</h3>
                <form onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={pwForm.currentPassword}
                      onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                      placeholder="Repeat new password"
                      required
                    />
                  </div>
                  {pwError && <p className="settings-error">{pwError}</p>}
                  {pwSuccess && <p className="settings-success">{pwSuccess}</p>}
                  <button type="submit" className="btn-save settings-submit-btn">
                    Update Password
                  </button>
                </form>
              </div>

              {/* Danger Zone */}
              <div className="settings-section danger-zone">
                <h3 className="settings-section-title danger-title">⚠️ Danger Zone</h3>
                <p className="danger-desc">
                  Deleting your account is permanent. All your posts will also be deleted and cannot be recovered.
                </p>
                <form onSubmit={handleDeleteAccount}>
                  <div className="form-group">
                    <label>Enter password to confirm</label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Your current password"
                      required
                    />
                  </div>
                  {deleteError && <p className="settings-error">{deleteError}</p>}
                  <button type="submit" className="btn-danger">
                    🗑️ Delete My Account
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
