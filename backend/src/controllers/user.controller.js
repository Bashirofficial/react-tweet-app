import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access and Refresh Token."
    );
  }
};

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  //just for safety purpose I have put it in try catch
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      //refreshToken is in userschema in user.model.js
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } = generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token has been successfully refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new ApiError(400, "Invalid Email format");
  }

  if (
    [username, fullName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with same email or username already exists");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  const profileLocalPath = req.files?.profileImg?.[0]?.path;
  const coverImagePath = req.files?.coverImg?.[0]?.path;

  const profileImage = profileLocalPath
    ? await uploadOnCloudinary(profileLocalPath)
    : null;
  const coverImage = coverImagePath
    ? await uploadOnCloudinary(coverImagePath)
    : null;

  const user = await User.create({
    fullName,
    email,
    password,
    username: username.toLowerCase(),
    profileImg: profileImage?.url || "",
    coverImg: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "fullName email username followers following profileImg coverImg"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Only secure in production
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Login successful"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, //this removes the field from document
      },
    },
    {
      new: true,
    }
  );
  const options = {
    //secure as this cookie can only be modified from server
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched successfully"));
});

const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username }).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User is fetched successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, bio, link } = req.body;

  const updateFields = {};
  if (fullName) updateFields.fullName = fullName;
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid Email format");
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail && existingEmail._id !== req.user._id) {
      throw new ApiError(400, "Email already exists");
    }
    updateFields.email = email;
  }
  if (username) updateFields.username = username;
  if (bio) updateFields.bio = bio;
  if (link) updateFields.link = link;

  const profileLocalPath = req.files?.profileImg?.[0]?.path;
  const coverLocalPath = req.files?.coverImg?.[0]?.path;

  if (profileLocalPath) {
    const profileImage = await uploadOnCloudinary(profileLocalPath);
    if (profileImage?.secure_url) {
      updateFields.profileImg = profileImage.secure_url;
    }
  }

  if (coverLocalPath) {
    const coverImage = await uploadOnCloudinary(coverLocalPath);
    if (coverImage?.secure_url) {
      updateFields.coverImg = coverImage.secure_url;
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: updateFields },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const followOrUnfollowUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userToModify = await User.findById(id);
  const currentUser = await User.findById(req.user?._id);

  if (id === req.user?._id.toString()) {
    throw new ApiError(400, "You can't follow or unfollow your own account");
  }

  if (!UserActivation || !currentUser) {
    throw new ApiError(404, "User not found!");
  }

  const isFollowing = currentUser.following.includes(id);
  if (isFollowing) {
    await User.findByIdAndUpdate(
      req.user?._id,
      {
        $pull: {
          following: id,
        },
      },
      { new: true }
    );

    await User.findByIdAndUpdate(
      id,
      {
        $pull: {
          followers: req.user?._id,
        },
      },
      { new: true }
    );
  } else {
    await User.findByIdAndUpdate(
      req.user?._id,
      {
        $push: {
          following: id,
        },
      },
      { new: true }
    );

    await User.findByIdAndUpdate(
      id,
      {
        $push: {
          followers: req.user?._id,
        },
      },
      { new: true }
    );
    const newNotification = new Notification({
      type: "follow",
      from: req.user?._id,
      to: userToModify._id,
    });

    await newNotification.save();
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        `Successfully ${isFollowing ? "unfollowed" : "followed"} the user!`
      )
    );
});

const getSuggestedUsers = asyncHandler(async (req, res) => {
  const usersFollowedByMe = await User.findById(req.user?._id).select(
    "following"
  );
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const suggestedUsers = await User.aggregate([
    {
      $match: {
        _id: { $ne: req.user?._id },
        _id: { $nin: user.following },
      },
    },
    { $sample: { size: 10 } },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        suggestedUsers,
        "Suggested users retrieved successfully"
      )
    );
});

export {
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
};
