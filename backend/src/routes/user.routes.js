import { Router } from "express";
import {
  refreshAccessToken,
  registerUser,
  loginUser,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  getUserProfile,
  followOrUnfollowUser,
  getSuggestedUsers,
  updateUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/refresh-token").post(refreshAccessToken);
router.route("/register").post(
  upload.fields([
    {
      name: "coverImg",
      maxCount: 1,
    },
    {
      name: "profileImg",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/profile/:username").get(verifyJWT, getUserProfile);
router.route("/follow-unfollow").post(verifyJWT, followOrUnfollowUser);
router.route("/get-suggested-users").get(verifyJWT, getSuggestedUsers);
router.route("/update-user").post(verifyJWT, updateUser);

export default router;
