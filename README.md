# ⚡ MarketerAI

Paste any company URL → get a full AI-generated marketing campaign instantly.  
Generates social posts (Twitter, LinkedIn, Instagram), email campaigns, and SEO blog content.

---

## 🚀 Deploy to Vercel in 5 Steps

### 1. Get an Anthropic API Key
- Go to [console.anthropic.com](https://console.anthropic.com)
- Create an account and generate an API key
- Copy it — you'll need it in step 5

### 2. Install dependencies & test locally
```bash
npm install
npm run dev
```
Open http://localhost:5173 — it won't work yet (no API key), but confirms everything loads.

### 3. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/marketer-ai.git
git push -u origin main
```

### 4. Deploy on Vercel
- Go to [vercel.com](https://vercel.com) and sign in
- Click **"Add New Project"**
- Import your GitHub repo
- Leave all build settings as default (Vercel auto-detects Vite)
- Click **Deploy**

### 5. Add your API Key (critical!)
- In your Vercel project dashboard, go to **Settings → Environment Variables**
- Add a new variable:
  - **Name:** `ANTHROPIC_API_KEY`
  - **Value:** `sk-ant-...` (your key from step 1)
- Click **Save**
- Go to **Deployments** and click **Redeploy** to apply the env variable

✅ Your app is now live!

---

## 📁 Project Structure

```
marketer-ai/
├── api/
│   └── generate.js      # Vercel serverless function (keeps API key secure)
├── src/
│   ├── main.jsx         # React entry point
│   └── App.jsx          # Main application
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

## 🔒 Security Note

Your Anthropic API key is stored as a Vercel environment variable and **never exposed to the browser**. All AI calls go through the serverless function in `/api/generate.js`.
