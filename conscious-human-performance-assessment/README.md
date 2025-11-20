# Conscious Human Performance Assessment

## Prerequisites

1.  **Node.js**: Download and install from [nodejs.org](https://nodejs.org).
2.  **Firebase CLI**: Run `npm install -g firebase-tools` in your terminal.

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Configure Environment Variables**
    Create a file named `.env` in the root directory.
    Add your Google Gemini API Key:
    ```
    VITE_API_KEY=your_api_key_here
    ```

## Deployment

To deploy to the web:

```bash
# 1. Build the project
npm run build

# 2. Login to Google (if not logged in)
firebase login

# 3. Deploy to Firebase Hosting
firebase deploy
```

The terminal will provide you with a URL (e.g., `https://conscious-human-performance.web.app`) where your app is live.
