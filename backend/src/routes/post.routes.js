import { Router } from "express";
import {
  createPost,
  deletePost,
  commentOnPost,
  updateComment,
  likeUnlikePost,
  getAllPost,
  getLikedPosts,
  getFollowingPosts,
  getUserPosts,
} from "../controllers/post.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

//router.route("/update-user").post(verifyJWT, updateUser);

router.get("/all", verifyJWT, getAllPost);
router.get("/following", verifyJWT, getFollowingPosts);
router.get("/likes/:id", verifyJWT, getLikedPosts);
router.get("/user/:username", verifyJWT, getUserPosts);
router.post(
  "/create",
  upload.fields([
    {
      name: "img",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  createPost
);
router.post("/like/:id", verifyJWT, likeUnlikePost);
router.post("/comment/:id", verifyJWT, commentOnPost);
router.post("/update/:id", verifyJWT, updateComment);
router.delete("/:id", verifyJWT, deletePost);

export default router;
