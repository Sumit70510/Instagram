import cloudinary from "../utils/cloudinary.js";
import sharp from "sharp";
import { Story } from "../Models/story.model.js";
import { User } from "../Models/user.model.js";

export const createStory = async (req, res) => {
  try {
    const image = req.file;
    const authorId = req.id;

    if (!image) {
      return res.status(400).json({
        message: "Story image is required",
        success: false,
      });
    }

    const mimeType = image.mimetype;
    let optimizedImageBuffer = image.buffer;

    if (!mimeType.includes("heic") && !mimeType.includes("heif")) {
      let format = "jpeg";
      let sharpOptions = { quality: 80 };

      if (mimeType.includes("png")) {
        format = "png";
        sharpOptions = { compressionLevel: 8 };
      } else if (mimeType.includes("webp")) {
        format = "webp";
        sharpOptions = { quality: 85 };
      }

      optimizedImageBuffer = await sharp(image.buffer)
        .resize({ width: 1080, height: 1920, fit: "inside" })
        .toFormat(format, sharpOptions)
        .toBuffer();
    }

    const cloudResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "stories", resource_type: "auto" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(optimizedImageBuffer);
    });

    const story = await Story.create({
      user: authorId,
      image: cloudResponse.secure_url,
    });

    await story.populate({ path: "user", select: "username profilePicture" });

    return res.status(201).json({
      message: "Story created successfully",
      story,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

export const getStories = async (req, res) => {
  try {
    const currentUser = await User.findById(req.id).select("following");
    const allowedUsers = [req.id, ...(currentUser?.following || [])];
    const stories = await Story.find({
      user: { $in: allowedUsers },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "username profilePicture" });

    return res.status(200).json({
      stories,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

export const viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({ message: "Story not found", success: false });
    }

    if (!story.viewers.includes(req.id)) {
      story.viewers.push(req.id);
      await story.save();
    }

    await story.populate({ path: "user", select: "username profilePicture" });

    return res.status(200).json({
      story,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({ message: "Story not found", success: false });
    }

    if (story.user.toString() !== req.id) {
      return res.status(403).json({ message: "Not authorized to delete this story", success: false });
    }

    await story.remove();

    return res.status(200).json({
      message: "Story deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
};
