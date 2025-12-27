# ⚡ Chronicle - Quick Start

## 🎯 Start the App Locally (2 Steps)

### Step 1: Start Backend (Terminal 1)

```bash
cd "d:\Projects\Robo AI project"
python backend.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Step 2: Start Frontend (Terminal 2)

```bash
cd "d:\Projects\Robo AI project\chronicle-frontend"
npm start
```

Browser will open automatically at: `http://localhost:3000`

---

## ✅ All Files Restored

I've recreated all missing files:

### Frontend Files:
- ✅ `chronicle-frontend/package.json` - Dependencies
- ✅ `chronicle-frontend/src/App.js` - Main app
- ✅ `chronicle-frontend/src/index.js` - Entry point
- ✅ `chronicle-frontend/src/index.css` - Base styles
- ✅ `chronicle-frontend/src/reportWebVitals.js` - Performance
- ✅ `chronicle-frontend/src/setupTests.js` - Test config
- ✅ `chronicle-frontend/src/App.test.js` - Tests
- ✅ `chronicle-frontend/public/index.html` - HTML template
- ✅ `chronicle-frontend/public/manifest.json` - PWA config
- ✅ `chronicle-frontend/public/favicon.ico` - Icon
- ✅ `chronicle-frontend/public/logo192.png` - Logo
- ✅ `chronicle-frontend/public/logo512.png` - Logo

### Backend Files:
- ✅ `backend.py` - FastAPI server
- ✅ `requirements.txt` - Python dependencies (fixed for Render)
- ✅ `runtime.txt` - Python version

---

## 🎮 Try It Out

1. **Open**: http://localhost:3000
2. **Click**: "Try Demo Character" (backend must be running)
   - Or "Create Your First Character"
3. **Edit scenes** with natural language
4. **Try invalid edits** to see AI rejection

---

## 📱 Features You Can Test

### ✅ Working Features:
- **Continue Button** - If you have saved data
- **Create Character** - Define traits and personality
- **Scene Timeline** - Horizontal scrolling timeline
- **Natural Language Editing** - "Make her smile"
- **Invalid Edit Rejection** - "Change eye color"
- **AI Image Generation** - Free via Pollinations.ai
- **localStorage** - Data persists across refreshes
- **Demo Character** - Pre-loaded Maya Chen story

### 🔧 Backend Required For:
- Try Demo Character
- Create New Character
- Execute Edits
- AI Processing

### 💾 Works Without Backend:
- Continue with saved data
- View saved timeline
- Browse saved scenes
- localStorage persistence

---

## 🚀 Deploy to Production

When ready to deploy:

**Read**: [DEPLOY_SIMPLE.md](DEPLOY_SIMPLE.md)

**Quick Deploy**:
1. **Backend** → Render (free)
2. **Frontend** → Netlify (free)
3. **Fix CORS** in backend.py
4. **Done!** 🎉

---

## 🐛 Troubleshooting

### Frontend won't start?
```bash
cd "d:\Projects\Robo AI project\chronicle-frontend"
rm -rf node_modules
npm install
npm start
```

### Backend won't start?
```bash
cd "d:\Projects\Robo AI project"
pip install -r requirements.txt
python backend.py
```

### Port already in use?
- Backend: Kill process on port 8000
- Frontend: Kill process on port 3000

### Dependencies installed successfully!
You can now run:
```bash
npm start
```

---

## 📊 What's Next?

1. ✅ **Test locally** - Make sure everything works
2. 🚀 **Deploy** - Follow DEPLOY_SIMPLE.md
3. 🎨 **Customize** - Modify App.js as needed
4. 🔗 **Share** - Give others the deployed URL

---

**Your app is ready to run!** 🎬
