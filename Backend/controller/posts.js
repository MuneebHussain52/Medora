const express = require("express");
const router = express.Router();
const Post = require("../modal/posts-schema");
const auth = require("../controller/auth/auth");
const userController = require("./auth/auth");
const User = require("../modal/user-schema");
const postschema = require("../modal/posts-schema");

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "name _id profilePic")
      .populate("comments.user", "name _id profilePic");
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
};

exports.createpost = async (req, res) => {
  try {
    const { text, image, taggedNames } = req.body;

    // Resolve tagged user names to IDs
    let taggedUsers = [];
    if (Array.isArray(taggedNames) && taggedNames.length > 0) {
      const foundUsers = await User.find({ name: { $in: taggedNames } }).select("_id");
      taggedUsers = foundUsers.map((u) => u._id);
    }

    const post = new Post({
      user: req.user._id,
      text,
      image,
      taggedUsers,
    });
    await post.save();
    const populatedPost = await Post.findOne({ _id: post._id })
      .populate("user")
      .populate("taggedUsers", "name _id profilePic");

    res
      .status(201)
      .json({ message: "Post created successfully", post: populatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating post" });
  }
};

exports.likepost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userIdString = userId.toString();
    const hasLiked = post.likes.some((id) => id.toString() === userIdString);

    if (hasLiked) {
      // Unlike the post
      post.likes = post.likes.filter((id) => id.toString() !== userIdString);
      await post.save();
      res
        .status(200)
        .json({ message: "Post unliked successfully", liked: false });
    } else {
      // Like the post
      post.likes.push(userId);
      await post.save();
      res.status(200).json({ message: "Post liked successfully", liked: true });
    }
  } catch (error) {
    res.status(500).json({ message: "Error liking post", error });
  }
};

exports.commentpost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            user: req.user._id,
            text,
          },
        },
        $inc: { commentCount: 1 },
      },
      { new: true },
    )
      .populate("user", "name") // post owner
      .populate("comments.user", "name"); // comment authors

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Comment added successfully", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding comment", error });
  }
};

exports.deletepost = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Only the post owner can delete it
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await Post.deleteOne({ _id: postId });
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting post", error });
  }
};

exports.deletecomment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Only the comment author can delete their comment
    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await Post.findByIdAndUpdate(postId, {
      $pull: { comments: { _id: commentId } },
      $inc: { commentCount: -1 },
    });

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting comment", error });
  }
};

exports.updatepost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    post.text = text;
    await post.save();
    res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating post", error });
  }
};

exports.getpost = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username")
      .populate("comments.user", "username")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts", err });
  }
};

exports.getuserpost = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ user: userId })
      .populate("user", "name _id profilePic")
      .populate("comments.user", "name _id profilePic");
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user posts", error });
  }
};

exports.getpostcomment = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId).populate("comments.user", "name"); // populate only 'name' of comment user

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post.comments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post comments", error });
  }
};

exports.getpostlike = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post.likes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post likes", error });
  }
};

exports.getpostlikecount = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post.likeCount);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post like count", error });
  }
};

exports.getpostcommentcount = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post.commentCount);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching post comment count", error });
  }
};

exports.getprofile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile", error });
  }
};

// Toggle save/unsave a post
exports.savepost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const user = await User.findById(userId);
    const alreadySaved = user.savedPosts.some((id) => id.toString() === postId);

    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter((id) => id.toString() !== postId);
    } else {
      user.savedPosts.push(postId);
    }
    await user.save();
    res.status(200).json({ saved: !alreadySaved });
  } catch (error) {
    res.status(500).json({ message: "Error saving post", error });
  }
};

// Get all saved posts of a user
exports.getsavedposts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: "savedPosts",
      populate: [
        { path: "user", select: "name _id profilePic" },
        { path: "comments.user", select: "name _id profilePic" },
      ],
    });
    res.status(200).json(user.savedPosts.reverse());
  } catch (error) {
    res.status(500).json({ message: "Error fetching saved posts", error });
  }
};

// Get posts where a user is tagged
exports.gettaggedposts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ taggedUsers: userId })
      .sort({ createdAt: -1 })
      .populate("user", "name _id profilePic")
      .populate("comments.user", "name _id profilePic")
      .populate("taggedUsers", "name _id profilePic");
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tagged posts", error });
  }
};
