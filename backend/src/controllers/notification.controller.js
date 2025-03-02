import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Notification } from "../models/notification.model.js";

const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const notification = await Notification.find({ to: userId }).populate({
    path: "from",
    select: "username profileImg",
  });

  await Notification.updateMany({ to: userId, read: false }, { read: true });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        notification,
        "Notification has been fetched successfully"
      )
    );
});

const deleteNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const { notificationId } = req.params;
  const notification = await Notification.findOne({
    _id: notificationId,
    to: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  await Notification.findByIdAndDelete(notificationId);

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Notification has been deleted successfully")
    );
});

export { getNotifications, deleteNotifications };
