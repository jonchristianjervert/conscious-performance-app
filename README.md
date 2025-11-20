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
4.  **Create API Key (The Magic Command)**:
    Replace `YOUR_KEY` below with your actual Gemini API Key and run:
    ```bash
    echo "VITE_API_KEY=YOUR_ACTUAL_KEY_HERE" > .env
    ```
5.  **Deploy**:
    ```bash
    npm run deploy
    ```

## Alternative: Deploy via GitHub & Vercel

If the web uploader fails, run these commands in your terminal to push your code to GitHub manually:

1.  Create a new repository on GitHub.
2.  Run these commands in your project folder:

```bash
git init
git add .
git commit -m "Ready for deployment"
git branch -M main
# Replace the URL below with YOUR GitHub repository URL
git remote add origin https://github.com/YOUR_USERNAME/conscious-human-performance.git
git push -u origin main
```

## Troubleshooting

**Error: "ENOENT: no such file or directory"**
This means your terminal is not inside the project folder. See Step 2 above (dragging the folder into the terminal).

**Error: "Command not found: npm"**
You need to install Node.js. Close and reopen your terminal after installing.