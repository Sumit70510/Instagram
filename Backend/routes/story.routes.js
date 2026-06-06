import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";
import { createStory, getStories, viewStory, deleteStory } from "../controllers.js/story.controller.js";

const router = express.Router();

router.route("/create").post(isAuthenticated, upload.single("image"), createStory);
router.route("/").get(isAuthenticated, getStories);
router.route("/:storyId/view").post(isAuthenticated, viewStory);
router.route("/:storyId").delete(isAuthenticated, deleteStory);

export default router;
