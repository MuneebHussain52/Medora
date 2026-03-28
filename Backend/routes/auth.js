const express = require("express");
const {
  Login,
  Signup,
  Logout,
  getUserProfile,
  getProfile,
  followUser,
  updateProfile,
} = require("../controller/auth/auth");
const authmiddleware = require("../middleware/auth");
const router = express.Router();

router.post("/login", Login);
router.post("/signup", Signup);
router.post("/logout", Logout);
router.get("/userprofile", authmiddleware, getUserProfile);
router.get("/getprofile/:userId", getProfile);
router.post("/followuser/:userId", authmiddleware, followUser);
router.put("/updateprofile", authmiddleware, updateProfile);

module.exports = router;
