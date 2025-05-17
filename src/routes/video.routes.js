import { Router } from "express";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public route: Get all videos
router.route("/").get(getAllVideos);

// Secure route: Publish a new video (Requires authentication)
router.route("/publish").post(
    verifyJWT,
    upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "video", maxCount: 1 }
    ]),
    publishAVideo
);

// Public route: Get a video by its ID
router.route("/:videoId").get(getVideoById);

// Secure routes: Update or delete a video (Requires authentication)
router.route("/:videoId")
    .patch(verifyJWT,upload.fields([
        { name: "thumbnail", maxCount: 1 }
    ])
    , updateVideo)
    .delete(verifyJWT, deleteVideo);

// Secure route: Toggle video publish status
router.route("/:videoId/toggle-publish").patch(verifyJWT, togglePublishStatus);

export default router;
