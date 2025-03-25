import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { userId } = req.user; // Assuming userId is coming from authentication middleware

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({ channel: channelId, subscriber: userId });

    if (existingSubscription) {
        // Unsubscribe if already subscribed
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(new ApiResponse(200, null, "Unsubscribed successfully."));
    } else {
        // Subscribe if not already subscribed
        const newSubscription = await Subscription.create({ channel: channelId, subscriber: userId });
        return res.status(200).json(new ApiResponse(200, newSubscription, "Subscribed successfully."));
    }
});

// Controller to return the subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId?.trim()) {
        throw new ApiError(400, "Channel ID is missing");
    }

    const subList = await Subscription.find({ channel: channelId }).populate("subscriber", "username email");

    res.status(200).json(new ApiResponse(200, subList, "Subscriber list fetched successfully."));
});

// Controller to return the channel list to which a user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!subscriberId?.trim()) {
        throw new ApiError(400, "Subscriber ID is missing");
    }

    const subdList = await Subscription.find({ subscriber: subscriberId }).populate("channel", "name");

    res.status(200).json(new ApiResponse(200, subdList, "Subscribed list fetched successfully."));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};
