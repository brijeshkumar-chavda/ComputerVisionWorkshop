const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
require("dotenv").config();

// Configuration
ffmpeg.setFfmpegPath(ffmpegPath);
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI Client
const client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
  defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION },
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
});

// File Upload Config
const upload = multer({ dest: "uploads/" });

// Helper: Encode Image to Base64
function encodeImage(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString("base64");
}

// Route: Analyze Image
app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const base64Image = encodeImage(req.file.path);
    const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT, // Not always needed for Azure, but good practice
      messages: [
        {
          role: "system",
          content: "You are a helpful AI that describes images detailedly.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "What is in this image? Describe it." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 500,
    });

    // Cleanup
    fs.unlinkSync(req.file.path);

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).json({ error: error.message });
  }
});

// Route: Analyze Video
app.post("/api/analyze-video", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No video uploaded" });

    const videoPath = req.file.path;
    console.log("Processing video:", videoPath);

    // 1. Extract frames (e.g., 5 frames total)
    // We'll use a promise wrapper for ffmpeg
    const screenshotsDir = path.join(
      __dirname,
      "uploads",
      `frames_${Date.now()}`
    );
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

    await new Promise((resolve, reject) => {
      ffmpeg(videoPath).on("end", resolve).on("error", reject).screenshots({
        count: 5,
        folder: screenshotsDir,
        filename: "frame-%i.png",
        size: "?x480", // Resize to reduce tokens
      });
    });

    // 2. Read frames
    const frameFiles = fs.readdirSync(screenshotsDir).sort();
    const contentContent = [
      {
        type: "text",
        text: "These are frames from a video. Describe what is happening in the video.",
      },
    ];

    for (const file of frameFiles) {
      const framePath = path.join(screenshotsDir, file);
      const base64 = encodeImage(framePath);
      contentContent.push({
        type: "image_url",
        image_url: { url: `data:image/png;base64,${base64}` },
      });
    }

    // 3. Send to OpenAI
    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT,
      messages: [
        { role: "system", content: "You are a video analysis AI." },
        { role: "user", content: contentContent },
      ],
      max_tokens: 500,
    });

    // Cleanup
    fs.unlinkSync(videoPath);
    fs.rmSync(screenshotsDir, { recursive: true, force: true });

    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error("Error analyzing video:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
