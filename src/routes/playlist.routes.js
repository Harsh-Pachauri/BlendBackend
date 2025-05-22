import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply verifyJWT middleware to all routes
router.use(verifyJWT);

// Create a new playlist
router.route("/").post(createPlaylist);

// Get all playlists for a user
router.route("/user/:userId").get(getUserPlaylists);

// Get, update, or delete a specific playlist
router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

// Add or remove a video from a playlist
router.route("/:playlistId/add/:videoId").patch(addVideoToPlaylist);
router.route("/:playlistId/remove/:videoId").patch(removeVideoFromPlaylist);

export default router;
