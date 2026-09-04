<p align="center">
  <img src="./public/assets/evilchat-logo.png" height="69" alt="EvilChat Logo">
  <h1 align="center">EvilChat</h1>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-609d8d?style=flat&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/LangChain-1C3C3C?style=flat&logo=langchain&logoColor=white" alt="LangChain">
  <img src="https://img.shields.io/badge/Ollama-FFFFFF?style=flat&logo=ollama&logoColor=black" alt="Ollama">
  <img src="https://img.shields.io/badge/RAG-3D3D3B?style=flat&logo=revoltdotchat&logoColor=white" alt="RAG">
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white" alt="Vercel">
  <img src="https://img.shields.io/badge/Render-3b2b4a?style=flat&logo=render&logoColor=white" alt="Render">
  <img src="https://img.shields.io/badge/Cloudflare-F38020?style=flat&logo=cloudflare&logoColor=white" alt="Cloudflare">
</p>
<br>

**EvilChat 😈** is an experimental, satirical AI chat application engineered to be intentionally toxic, sarcastic, and brutally offensive. Moving away from standard, helpful AI assistants, this project explores the boundaries of prompt engineering and "uncensored" LLMs.

🚀 **Powered by Local RAG & Dual-Execution!** The system pulls context from a custom vector database of profanities and allows users to run inference entirely locally (for maximum privacy) or via cloud APIs.

## 📸 Application Overview

<p align="center">
  <img src="./public/assets/evilchat-ss1.png" width="65%" alt="Desktop View">
  &nbsp;&nbsp;&nbsp;
  <img src="./public/assets/evilchat-ss2.png" width="25%" alt="Mobile View">
</p>
<p align="center"><i>A meticulously crafted, dark-themed UI that works seamlessly across desktop and mobile devices.</i></p>

<br>

## 🚀 Key Capabilities

### 1. 🧠 Retrieval-Augmented Generation (RAG)
EvilChat doesn't just rely on standard LLM weights. It uses a custom knowledge base!
* **Vector Database:** Automatically parses PDF, TXT, and JSON files located in the `./docs` folder.
* **ChromaDB & HuggingFace:** Text is chunked and embedded using `all-MiniLM-L6-v2` to retrieve the most contextually accurate insults before generating a response.

### 2. ⚙️ Dual Execution Architecture
The system is highly flexible and can be run in two distinct modes configured via `.env`:
* **Mode 1: 100% Local (Ollama) 📍** - Runs `gemma3-UNCENSORED` directly on your hardware. No internet required, absolute privacy, zero censorship.
* **Mode 2: Cloud API (OpenRouter) ☁️** - Connects to high-tier uncensored models like `dolphin-mistral-24b` for more complex and creative toxicity.

### 3. 🎙️ Native Speech-to-Text
* Leverages the browser's native `SpeechRecognition` API.
* Includes custom CSS keyframe animations (waveform scaling) that react when the microphone is active.
* **Bilingual Support:** The AI automatically detects whether you are speaking/writing in English or Polish.

### 4. 🛡️ API Protection & Rate Limiting
* The FastAPI backend is protected by **SlowAPI**.
* Enforces strict rate limits (e.g., 5 requests/minute per IP) to prevent spamming and API credit exhaustion.

<br>

## 🗺️ Roadmap & Future Features

The system is in active development. Upcoming updates include:
* 🔐 **Authentication:** User accounts registration and secure login.
* 📚 **Chat History:** Persistent database storage for previous conversations linked to user accounts.
* 🤖 **Dynamic Model Switcher:** A UI dropdown in the sidebar allowing users to seamlessly switch between different LLMs (e.g., Llama 3, Gemma, Mistral) on the fly.

<br>

## 🔄 Installation & Local Setup

Want to run this locally? Follow these steps:

### Prerequisites
* Node.js (v18+)
* Python 3.10+
* [Ollama](https://ollama.com/) (installed and running in the background)

### 1. Clone & Install
```bash
git clone https://github.com/stvshy/evilchat.git
cd evilchat

# Install Frontend dependencies
npm install

# Install Backend dependencies
pip install -r requirements.txt
```

### 2. Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```env
EVIL_MODE=LOCAL
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 3. Initialize the Vector Database (RAG)
Place your context files (PDF, TXT, JSON) inside the `./docs` folder, then run:
```bash
python create_db.py
```

### 4. Run the Application
You can use the provided Windows batch script which handles everything automatically:
```cmd
start.bat
```
*(Note: During the very first launch, Ollama will automatically download the ~1GB `gemma3-UNCENSORED` model. This might take a few minutes depending on your internet connection. Subsequent launches will be instant.)*

<br>

## ⚠️ Disclaimer

This project is created strictly for **educational, experimental, and satirical purposes**. The responses generated by the AI do not reflect the views of the developer. **Do not use this system in production environments where users expect standard, helpful customer service.**

<br>

## 📄 License

**All Rights Reserved.**

This project and its source code are the intellectual property of the author. You are free to view and inspect the code for educational purposes, however, **any commercial use, monetization, reproduction, or redistribution of this software without explicit permission is strictly prohibited.**
