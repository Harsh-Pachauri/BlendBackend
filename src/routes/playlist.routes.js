import { Router } from "express";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Create a new playlist (protected route)
router.route("/").post(verifyJWT, createPlaylist);

// Get all playlists of a user
router.route("/user/:userId").get(getUserPlaylists);

// Get a playlist by ID
router.route("/:playlistId").get(getPlaylistById);

// Update playlist details (protected route)
router.route("/:playlistId").patch(verifyJWT, updatePlaylist);

// Delete a playlist (protected route)
router.route("/:playlistId").delete(verifyJWT, deletePlaylist);

// Add a video to a playlist (protected route)
router.route("/:playlistId/video/:videoId").post(verifyJWT, addVideoToPlaylist);

// Remove a video from a playlist (protected route)
router.route("/:playlistId/video/:videoId").delete(verifyJWT, removeVideoFromPlaylist);

export default router;
