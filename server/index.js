const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static");
require("dotenv").config();

// Configuration
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);
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
    let objectContent;

    // Check if it's a file upload
    if (req.file) {
      const base64Image = encodeImage(req.file.path);
      const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
      objectContent = { type: "image_url", image_url: { url: dataUrl } };

      // Cleanup file immediately after reading
      fs.unlinkSync(req.file.path);

      // Check if it's a URL
    } else if (req.body.imageUrl) {
      objectContent = {
        type: "image_url",
        image_url: { url: req.body.imageUrl },
      };
    } else {
      return res.status(400).json({ error: "No image or URL provided" });
    }

    if (!objectContent) {
      console.log("Error: No image content found. REQ BODY:", req.body);
      return res.status(400).json({ error: "No image or URL provided" });
    }

    console.log("Analyzing Image...", req.body.imageUrl ? "URL" : "FILE");

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT,
      messages: [
        {
          role: "system",
          content: `You are an AI Vision Assistant. Identify the main object in the image.
          
          Return a raw, valid JSON object (no markdown, no backticks) with exactly these fields:
          {
             "general_description": "2-3 sentences describing the image.",
             "number_of_people": "Count (e.g., '1 person', 'No people', '3 people')",
             "objects": "List of main objects (e.g., 'Persian Cat, Sofa, Window')"
          }
          `,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image." },
            objectContent,
          ],
        },
      ],
      max_tokens: 300,
    });

    let result = response.choices[0].message.content;

    // Clean up potential markdown code blocks
    if (result.startsWith("```")) {
      result = result
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }

    try {
      const jsonResult = JSON.parse(result);
      res.json({ result: jsonResult });
    } catch (e) {
      console.error("Failed to parse AI JSON:", result);
      res.json({
        result: {
          general_description: result,
          number_of_people: "Unknown",
          objects: "Unknown",
        },
      });
    }
  } catch (error) {
    console.error("Error analyzing image:", error);
    if (error.response) {
      console.error("OpenAI Response Error:", error.response.data);
    }

    // Handle Content Filter or 400 Bad Request from Azure
    console.log("Error object details:", error); // Debugging
    if (
      error.code === "content_filter" ||
      (error.error && error.error.code === "content_filter")
    ) {
      return res.json({
        result:
          "I cannot analyze this image due to safety content filters (Azure OpenAI Refusal).",
      });
    }

    // Fallback for general errors
    if (error.error && error.error.message) {
      return res.json({ result: `Error: ${error.error.message}` });
    }

    res.status(500).json({
      error:
        "Failed to analyze image. Ensure the URL is directly accessible (ends in .jpg/.png) and not protected.",
    });
  }
});

// Route: Analyze Live Feed (Structured)
app.post("/api/analyze-live", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No image capture received" });
    }

    const base64Image = encodeImage(file.path);
    const objectContent = {
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`,
      },
    };

    // Cleanup file immediately after reading
    fs.unlinkSync(file.path);

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT,
      messages: [
        {
          role: "system",
          content: `You are an AI Vision Assistant analyzing a live camera feed.
          
          Return a raw, valid JSON object (no markdown, no backticks) with exactly these fields:
          {
             "general_description": "2-3 sentences describing the scene.",
             "number_of_people": "Count (e.g., '1 person', 'No people', '3 people')",
             "objects": "List of main objects (e.g., 'Laptop, Coffee Cup, Keyboard')"
          }
          `,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this frame." },
            objectContent,
          ],
        },
      ],
      max_tokens: 300,
    });

    let result = response.choices[0].message.content;

    // Clean up potential markdown code blocks if AI adds them
    if (result.startsWith("```")) {
      result = result
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }

    try {
      const jsonResult = JSON.parse(result);
      res.json({ result: jsonResult });
    } catch (e) {
      console.error("Failed to parse AI JSON:", result);
      res.json({
        result: {
          general_description: "Error parsing AI response",
          number_of_people: "Unknown",
          objects: "Unknown",
        },
      });
    }
  } catch (error) {
    console.error("Error analyzing live feed:", error);
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
        {
          role: "system",
          content: `You are a video analysis AI.
          
          Return a raw, valid JSON object (no markdown, no backticks) with exactly these fields:
          {
             "general_description": "2-3 sentences describing the action in the video.",
             "number_of_people": "Count (e.g., '1 person', 'No people', '3 people')",
             "objects": "List of main objects (e.g., 'Robot, Box, Shelf')"
          }
          `,
        },
        { role: "user", content: contentContent },
      ],
      max_tokens: 500,
    });

    // Cleanup
    fs.unlinkSync(videoPath);
    fs.rmSync(screenshotsDir, { recursive: true, force: true });

    let result = response.choices[0].message.content;

    // Clean up potential markdown code blocks
    if (result.startsWith("```")) {
      result = result
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }

    try {
      const jsonResult = JSON.parse(result);
      res.json({ result: jsonResult });
    } catch (e) {
      console.error("Failed to parse AI JSON:", result);
      res.json({
        result: {
          general_description: result,
          number_of_people: "Unknown",
          objects: "Unknown",
        },
      });
    }
  } catch (error) {
    console.error("Error analyzing video:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
