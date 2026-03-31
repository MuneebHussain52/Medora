const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../modal/user-schema");
require("dotenv").config();

exports.Signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
};

exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ message: "Login successful", token, id: user._id });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
};

exports.Logout = async (req, res) => {
  try {
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Error logging out", error });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile", error });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile", error });
  }
};

exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params; // User to follow
    const currentUserId = req.user._id; // Logged-in user

    console.log("Follow request:", {
      userId,
      currentUserId: currentUserId.toString(),
    });

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const userToFollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      console.log("User not found:", {
        userToFollow: !!userToFollow,
        currentUser: !!currentUser,
      });
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize arrays if they don't exist (for backward compatibility)
    if (!Array.isArray(currentUser.following)) {
      currentUser.following = [];
    }
    if (!Array.isArray(userToFollow.followers)) {
      userToFollow.followers = [];
    }
    if (!Array.isArray(currentUser.followers)) {
      currentUser.followers = [];
    }
    if (!Array.isArray(userToFollow.following)) {
      userToFollow.following = [];
    }

    // Check if already following
    const isFollowing = currentUser.following.some(
      (id) => id.toString() === userId,
    );
    console.log("Is following:", isFollowing);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== userId,
      );
      userToFollow.followers = userToFollow.followers.filter(
        (id) => id.toString() !== currentUserId.toString(),
      );
    } else {
      // Follow
      currentUser.following.push(userId);
      userToFollow.followers.push(currentUserId);
    }

    await currentUser.save();
    await userToFollow.save();

    console.log("Follow operation successful:", { following: !isFollowing });

    res.status(200).json({
      following: !isFollowing,
      followersCount: userToFollow.followers.length,
      followingCount: userToFollow.following.length,
    });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({
      message: "Error following/unfollowing user",
      error: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, bio, profilePic } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (profilePic !== undefined) user.profilePic = profilePic;

    await user.save();

    const updatedUser = await User.findById(userId).select("-password");
    res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error changing password", error: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Password is incorrect" });

    // Delete user's posts
    const Post = require("../../modal/posts-schema");
    await Post.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting account", error: error.message });
  }
};
