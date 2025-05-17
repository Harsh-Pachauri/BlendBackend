import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const filter = {
        isPublished: true,
        ...(query && { 
            $or: [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } }
            ] 
        }),
        ...(userId && { owner: new mongoose.Types.ObjectId(userId) })
    };

    // ✅ Create aggregation pipeline
    const aggregation = Video.aggregate([
        { $match: filter }, // Filter videos
        { 
            $lookup: { 
                from: "users", 
                localField: "owner", 
                foreignField: "_id", 
                as: "owner" 
            }
        },
        { $unwind: "$owner" }, // Convert owner array to object
        { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } } // Sorting
    ]);

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };

    // ✅ Use `aggregatePaginate`
    const videos = await Video.aggregatePaginate(aggregation, options);

    return res.status(200).json({
        success: true,
        message: "Videos fetched successfully.",
        totalPages: videos.totalPages,
        currentPage: videos.page,
        totalVideos: videos.totalDocs,
        videos: videos.docs,
    });
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, username } = req.body;

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required.");
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail upload failed.");
    }

    const videoLocalPath = req.files?.video[0]?.path;
    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required.");
    }
    const videofile = await uploadOnCloudinary(videoLocalPath);
    if (!videofile) {
        throw new ApiError(400, "Video upload failed.");
    }

    // Ensure views and isPublished are defined
    const views = 0;
    const isPublished = true;

    // Get the user ID from username
    const user = await User.findOne({ username });
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    const video = await Video.create({
        videoFile: videofile.url, // Fix key name
        thumbnail: thumbnail.url,
        title,
        description,
        duration: 0,
        views,
        isPublished,
        owner: user._id, // Store ObjectId, not username
    });

    const createdVideo = await Video.findById(video._id);
    
    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while uploading the video.");
    }

    return res.status(201).json(
        new ApiResponse(200, createdVideo, "Video uploaded successfully.")
    );
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is missing");
    }

    // Fetch video from Video collection
    const video = await Video.findOne(
        { _id: videoId },
        {
            videoFile: 1,
            thumbnail: 1,
            title: 1,
            description: 1,
            duration: 1,
            views: 1,
            isPublished: 1, // ✅ Now it's part of the inclusion list
            owner: 1
        }
    );
    

    if (!video) {
        throw new ApiError(404, "Video not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Video Details fetched successfully.")
    );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    // Debugging - log received files
    console.log("Request Files:", req.files);
    
    if (!req.files?.thumbnail) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    // 1. Upload new thumbnail to Cloudinary
    const thumbnailLocalPath = req.files.thumbnail[0].path;
    console.log("Uploading thumbnail from:", thumbnailLocalPath);
    
    const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!newThumbnail?.url) {
        throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
    }

    // 2. Delete old thumbnail from Cloudinary if exists
    if (video.thumbnail) {
        try {
            const oldThumbnailPublicId = video.thumbnail
                .split('/')
                .slice(-2)
                .join('/')
                .split('.')[0];
                
            await deleteFromCloudinary(oldThumbnailPublicId, "image");
            console.log("Deleted old thumbnail from Cloudinary");
        } catch (error) {
            console.error("Error deleting old thumbnail:", error);
        }
    }

    // 3. Update video with new thumbnail
    video.thumbnail = newThumbnail.url;
    if (title) video.title = title;
    if (description) video.description = description;

    await video.save();

    // 4. Clean up local temp file
    try {
        fs.unlinkSync(thumbnailLocalPath);
        console.log("Deleted local temp file:", thumbnailLocalPath);
    } catch (error) {
        console.error("Error deleting local file:", error);
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Video updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Find the video by ID
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found.");
    }

    // Extract Cloudinary public IDs from URLs
    const videoPublicId = video.videoFile.split("/").pop().split(".")[0];
    const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];

    // Delete from Cloudinary
    const videoDeletion = await deleteFromCloudinary(videoPublicId);
    const thumbnailDeletion = await deleteFromCloudinary(thumbnailPublicId);

    if (!videoDeletion || !thumbnailDeletion) {
        throw new ApiError(500, "Failed to delete video from Cloudinary.");
    }

    // Delete from database
    const deletedVideo = await Video.findByIdAndDelete(videoId);
    if (!deletedVideo) {
        throw new ApiError(500, "Failed to delete video from database.");
    }

    return res.status(200).json(new ApiResponse(200, "Video deleted successfully."));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found.");
    }

    video.isPublished=!(video.isPublished);

    await video.save();
    return res.status(200).json(
        new ApiResponse(200,video.isPublished,"Video status changed successfully.")
    );



})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}