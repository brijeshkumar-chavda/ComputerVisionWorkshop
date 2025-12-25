# Project Name: AI Vision Assistant

## Summary

AI Vision Assistant is a powerful, full-stack web application that leverages the latest Multimodal Large Language Models (LLM) to "see" and understand the world. It provides real-time analysis of three types of visual input: static images, uploaded videos, and live webcam feeds. Unlike traditional computer vision which requires training specific models for specific objects, this assistant uses Generative AI (GPT-4o) to provide human-like descriptions, object counts, and context awareness out of the box.

## Problem Statement

Traditional Computer Vision is hard. To build an app that recognizes a "cat", a "car", and a "laptop", you traditionally need to train separate models or use complex deep learning libraries (YOLO, OpenCV) that are limited to a fixed set of classes.
**The Problem:** How can we build a vision system that understands _anything_ (context, emotions, unusual objects) without training a custom model for months?
**The Solution:** Using Multimodal AI (like GPT-4o) allows developers to send _any_ image frame and ask complex questions in natural language, democratizing computer vision.

## Tech Stack

### Frontend (Client)

- **React + Vite**: For a fast, reactive user interface.
- **CSS Modules / Vanilla CSS**: For a clean, dark-mode compatible responsive design.
- **react-webcam**: For handling live camera streams in the browser.

### Backend (Server)

- **Node.js & Express**: API server to handle requests and file uploads.
- **Multer**: Handling image and video file uploads.
- **FFmpeg (fluent-ffmpeg & ffmpeg-static)**: Processing video files (extracting frames) to send to the AI.
- **Azure OpenAI**: The brain of the operation (GPT-4o deployment) that processes the visual data.

## Real-World Impact & Implementation

Students can take this core architecture and scale it into solutions that solve genuine human problems. By simply changing the "System Prompt" (the instructions we give the AI), this single codebase can transform into entirely different products:

1.  **Assistive Technology for the Blind**:

    - _Implementation:_ Hook the "Live" feed into a wearable camera (like a Raspberry Pi or phone).
    - _Impact:_ It can narrate the world to a visually impaired person: "There is a red pedestrian light ahead," or "You are holding a can of soup."

2.  **Smart Security & Safety**:

    - _Implementation:_ Connect to CCTV or doorbell cameras.
    - _Impact:_ instead of just recording, the AI can alert homeowners only for specific threats: "A delivery person left a package," vs. "Someone is trying to open the window."

3.  **Automated Retail Inventory**:

    - _Implementation:_ A camera pointing at a store shelf.
    - _Impact:_ Detects when stock is low ("Only 2 Coke bottles left") or when items are misplaced, automating stock checks.

4.  **Education & Learning**:
    - _Implementation:_ A mobile app for kids.
    - _Impact:_ A child points the camera at a leaf, and the AI identifies the tree species and explains its biology.

## Future Project Ideas

Students can extend this workshop code into these full projects:

- **The "Smart Chef"**: Analysis of a refrigerator interior photo to suggest recipes based on available ingredients.
- **"Form Fit" Gym Coach**: Analysis of a user's squat or pushup via video to provide feedback on their form and prevent injury.
- **Emotion Analyzer**: A realtime dashboard for public speakers that analyzes the audience's faces to tell the speaker if the crowd looks bored, excited, or confused.
- **Lost Pet Finder**: A community platform where users upload videos of stray dogs/cats, and the AI matches features (breed, color, size) against a database of lost pets.
