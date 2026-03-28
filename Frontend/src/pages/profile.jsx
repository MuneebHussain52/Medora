import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../components/profile.css";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "", profilePic: "" });

  const { userId: profileUserId } = useParams(); // User ID from URL
  const token = localStorage.getItem("token");
  const loggedInUserId = localStorage.getItem("userId");
  const API_BASE = "http://localhost:3000/api";
  const navigate = useNavigate();

  // Determine which user profile to show
  const userIdToShow = profileUserId || loggedInUserId;
  const isOwnProfile = userIdToShow === loggedInUserId;

  useEffect(() => {
    // Check if user is authenticated
    if (!token || !loggedInUserId) {
      navigate("/");
      return;
    }
    if (loggedInUserId) {
      fetchCurrentUser();
    }
  }, [loggedInUserId]);

  useEffect(() => {
    if (userIdToShow) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [userIdToShow]);

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(`${API_BASE}/userprofile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserId(res.data._id);
      // Check if current user is following this profile
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
      
      // Set edit form with current values
      setEditForm({
        name: res.data.name,
        bio: res.data.bio || "",
        profilePic: res.data.profilePic || "",
      });

      // Update following status based on fetched user data
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

  const handleFollow = async () => {
    try {
      const res = await axios.post(
        `${API_BASE}/followuser/${userIdToShow}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIsFollowing(res.data.following);
      // Update follower count in UI
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

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to current user values
    setEditForm({
      name: user.name,
      bio: user.bio,
      profilePic: user.profilePic,
    });
  };

  const handleSaveProfile = async () => {
    try {
      const res = await axios.put(
        `${API_BASE}/updateprofile`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(res.data.user);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile", err);
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  if (!user) return <p>Loading profile...</p>;

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
                  <button className="edit-profile-btn" onClick={handleEditProfile}>Edit Profile</button>
                  <button className="settings-btn">⚙️</button>
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
                <span className="stat-number">
                  {user.followers?.length || 0}
                </span>
                <span className="stat-label">followers</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {user.following?.length || 0}
                </span>
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

        <div className="profile-tabs">
          <button className="tab-btn active">
            <span className="tab-icon">📱</span> POSTS
          </button>
          <button className="tab-btn">
            <span className="tab-icon">🔖</span> SAVED
          </button>
          <button className="tab-btn">
            <span className="tab-icon">👤</span> TAGGED
          </button>
        </div>

        <div className="profile-posts-grid">
          {posts.length === 0 ? (
            <div className="no-posts-message">
              <div className="no-posts-icon">📷</div>
              <h3>No Posts Yet</h3>
              <p>
                When you share photos and videos, they'll appear on your
                profile.
              </p>
              <a href="/feedpage" className="share-first-post">
                Share your first post
              </a>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post._id} className="profile-post-card">
                {post.image ? (
                  <img
                    className="profile-post-image"
                    src={post.image}
                    alt="Post"
                  />
                ) : (
                  <div className="profile-post-text-only">
                    <p>{post.text}</p>
                  </div>
                )}
                <div className="post-overlay">
                  <span className="overlay-stat">
                    ❤️ {post.likes?.length || 0}
                  </span>
                  <span className="overlay-stat">
                    💬 {post.comments?.length || 0}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
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
    </div>
  );
}
