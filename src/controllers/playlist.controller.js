import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    // Validate request body
    if (!name || !description) {
        throw new ApiError(400, "Name and description are required.");
    }

    // Validate user authentication
    if (!req.user || !isValidObjectId(req.user.id)) {
        throw new ApiError(401, "Unauthorized: Invalid user.");
    }

    // Create new playlist
    const newPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user.id // Assign logged-in user as owner
    });

    res.status(201).json(new ApiResponse(201, newPlaylist, "Playlist created successfully."));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User ID.");
    }

    const playlists = await Playlist.find({ owner: userId });

    res.status(200).json(new ApiResponse(200, playlists, "User playlists fetched successfully."));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    // Fixed incorrect model reference from Video to Playlist
    const playlist = await Playlist.findById(playlistId).populate("video");
    
    if (!playlist) {
        throw new ApiError(404, "Playlist not found.");
    }

    res.status(200).json(new ApiResponse(200, playlist, "Playlist Details fetched successfully."));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Playlist ID or Video ID.");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { video: videoId } }, // Prevents duplicate entries
        { new: true }
    ).populate("video");

    if (!playlist) {
        throw new ApiError(404, "Playlist not found.");
    }

    res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist successfully."));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Playlist ID or Video ID.");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { video: videoId } }, // Removes videoId from video array
        { new: true }
    ).populate("video");

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found.");
    }

    res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully."));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) {
        throw new ApiError(404, "Playlist not found.");
    }

    res.status(200).json(new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully."));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID.");
    }

    if (!name || !description) {
        throw new ApiError(400, "Name and Description are required.");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { name, description },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found.");
    }

    res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully."));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
};
