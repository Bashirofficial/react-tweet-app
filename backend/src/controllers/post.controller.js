import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { Notification } from "../models/notification.model.js";
import mongoose from "mongoose";

const createPost = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const imgLocalPath = req.files?.img?.[0]?.path;
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found!");
  }
  if (!text && !imgLocalPath) {
    throw new ApiError(
      400,
      "Atleast post text message or an image is required"
    );
  }

  let imgUrl = null;

  if (imgLocalPath) {
    try {
      const uploadedImage = await uploadOnCloudinary(imgLocalPath);
      if (!uploadedImage) {
        throw new ApiError(500, "Failed to upload image. Please try again.");
      }
      imgUrl = uploadedImage.secure_url;
    } catch (error) {
      throw new ApiError(
        500,
        "Error uploading image to Cloudinary. Please try again."
      );
    }
  }

  const post = new Post({
    user: req.user?._id,
    text,
    img: imgUrl || "",
  });

  await post.save();

  const populatedPost = await Post.findById(post._id)
    .populate({ path: "user", select: "-password" })
    .populate({ path: "comments.user", select: "-password" });

  return res
    .status(200)
    .json(new ApiResponse(200, populatedPost, "User has done a post"));
});

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (post.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete the post.");
  }

  if (post.img) {
    const imgId = post.img.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(imgId);
  }
  await post.remove();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Post has been deleted successfully"));
});

const commentOnPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const { text } = req.body;
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiResponse("User not found");
  }

  const comment = { user: user._id, text };
  await post.comments.push(comment);
  await post.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment has been done successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const { text } = req.body;

  if (
    !mongoose.isValidObjectId(postId) ||
    !mongoose.isValidObjectId(commentId)
  ) {
    throw new ApiError(400, "Invalid post id or comment id");
  }
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }
  const comment = await post.comments.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment?.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this comment");
  }

  comment.text = text;
  await post.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const likeUnlikePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user?.id;
  if (!mongoose.isValidObjectId(postId) || !mongoose.isValidObjectId(userId)) {
    throw new ApiError(
      403,
      "Invalid post_id format or invalid user_id format!"
    );
  }
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(200, "Post not found");
  }

  const userLikedPost = await Post.likes.includes(userId);

  if (userLikedPost) {
    // Unlike post
    await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
    await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

    const updatedLikes = post.likes.filter(
      (id) => id.toString() !== userId.toString()
    );
    return new res.json(ApiResponse(200, updatedLikes, "Tweet unliked"));
  } else {
    // Like post
    post.likes.push(userId);
    await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
    await post.save();

    const notification = new Notification({
      from: userId,
      to: post.user,
      type: "like",
    });
    await notification.save();

    const updatedLikes = post.likes;
    return new res.json(ApiResponse(200, updatedLikes, "Tweet liked"));
  }
});

const getAllPost = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate({
      path: "user",
      select: "-password",
    })
    .populate({
      path: "comments.user",
      select: "-password",
    });

  return res
    .status(200)
    .json(
      new ApiResponse(200, posts, "All post has been fetched successfully")
    );
});

const getLikedPosts = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(
      403,
      "Invalid post_id format or invalid user_id format!"
    );
  }
  const user = await User.findById(userId).select("likedPosts");
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  const likedPosts = await Post.find({
    _id: {
      $in: user.likedPosts,
    },
  })
    .sort({ createdAt: -1 })
    .populate({
      path: "user",
      select: "-password",
    })
    .populate({
      path: "comments.user",
      select: "-password",
    });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedPosts,
        "Liked post has been successfully fethced"
      )
    );
});

const getFollowingPosts = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(
      403,
      "Invalid post_id format or invalid user_id format!"
    );
  }
  const user = await User.findById(userId).select("following");
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  const feedPosts = await Post.find({
    user: { $in: user.following },
  })
    .sort({ createdAt: -1 })
    .populate({
      path: "comments.user",
      select: "-password",
    });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        feedPosts,
        "Following post has been successfully fetched"
      )
    );
});

const getUserPosts = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(
      403,
      "Invalid post_id format or invalid user_id format!"
    );
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  const userPosts = await Post.find({ user: user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: "user",
      select: "-password",
    })
    .populate({
      path: "comments.user",
      select: "-password",
    });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userPosts,
        "User post has been fetched successfully "
      )
    );
});

export {
  createPost,
  deletePost,
  commentOnPost,
  updateComment,
  likeUnlikePost,
  getAllPost,
  getLikedPosts,
  getFollowingPosts,
  getUserPosts,
};
