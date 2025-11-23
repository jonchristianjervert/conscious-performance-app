
# Conscious Human Performance Assessment

## Prerequisites

1.  **Node.js**: Download and install from [nodejs.org](https://nodejs.org).
2.  **Firebase CLI**: Run `npm install -g firebase-tools` in your terminal.

## Quick Setup (Mac/Linux)

1.  **Download & Unzip** the project.
2.  **Open Terminal** and navigate to the folder:
    *   Type `cd ` (with a space).
    *   Drag the folder into the terminal window.
    *   Press Enter.
3.  **Install Dependencies**:
    ```bash
    npm install
    ```
4.  **Create API Keys**:
    Run this command to set up your local environment keys (replace placeholders with actual keys):
    ```bash
    echo "VITE_API_KEY=YOUR_GEMINI_KEY_HERE\nVITE_FIREBASE_API_KEY=YOUR_FIREBASE_KEY_HERE" > .env
    ```
5.  **Deploy**:
    ```bash
    npm run deploy
    ```

## Vercel Deployment

1.  Import project from GitHub.
2.  **Environment Variables**:
    *   `VITE_API_KEY`: Your Gemini API Key.
    *   `VITE_FIREBASE_API_KEY`: Your Firebase Web API Key.
3.  **Settings**:
    *   Root Directory: Empty (if files are in root).
    *   Output Directory: `dist`.
4.  Deploy.
