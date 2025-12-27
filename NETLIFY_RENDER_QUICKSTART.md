# ⚡ Quick Start - Netlify + Render

**The simplest way to deploy Chronicle - no CLI needed!**

---

## 🎯 Deploy in 3 Steps (15 minutes)

### Step 1: Deploy Backend to Render (5 min)

1. **Go to**: https://render.com → Sign up with GitHub
2. **New +** → **Web Service** → **Connect your repo**
3. **Configure**:
   ```
   Name: chronicle-backend
   Runtime: Python 3
   Build: pip install -r requirements.txt
   Start: uvicorn backend:app --host 0.0.0.0 --port $PORT
   Instance: Free
   ```
4. **Add Environment Variable**:
   ```
   GOOGLE_API_KEY = AIzaSyBXY4wTUbmb8syphseJM5oxod1j4b7CEfw
   ```
5. **Create Web Service** → Wait 3-5 minutes
6. **Copy URL**: `https://chronicle-backend.onrender.com` ✅

### Step 2: Deploy Frontend to Netlify (5 min)

1. **Go to**: https://netlify.com → Sign up with GitHub
2. **Add new site** → **Import from GitHub** → **Select repo**
3. **Configure**:
   ```
   Base directory: chronicle-frontend
   Build command: npm run build
   Publish directory: chronicle-frontend/build
   ```
4. **Add Environment Variable**:
   ```
   REACT_APP_API_URL = https://chronicle-backend.onrender.com
   ```
   (paste YOUR backend URL from Step 1)
5. **Deploy** → Wait 3-5 minutes
6. **Your app is live!** `https://[name].netlify.app` ✅

### Step 3: Fix CORS (5 min)

1. **Open**: `d:\Projects\Robo AI project\backend.py`
2. **Find line 28**, update to:
   ```python
   allow_origins=[
       "https://[your-netlify-name].netlify.app",  # Your actual URL
       "http://localhost:3000"
   ],
   ```
3. **Save, commit, push**:
   ```bash
   git add backend.py
   git commit -m "Add Netlify CORS"
   git push
   ```
4. Render auto-deploys in 2 minutes ✅

---

## ✅ Test Your App

1. **Visit**: `https://[your-name].netlify.app`
2. **Create character** → Should work ✅
3. **Edit scene**: "Make her smile" → New scene appears ✅
4. **Open Console** (F12) → No CORS errors ✅

---

## 🐛 Quick Fixes

### CORS Error?
- Update `backend.py` line 28 with your Netlify URL
- Git push → Render auto-deploys

### API Connection Failed?
- Check: Netlify → Site settings → Environment variables
- Verify: `REACT_APP_API_URL` is correct
- Redeploy: Deploys → Trigger deploy → Clear cache

### Backend Sleeping?
- Free tier sleeps after 15 min idle
- First request takes 30-60 sec (wake-up time)
- This is normal for free tier ✅

---

## 📱 Your URLs

**Frontend**: `https://[name].netlify.app`
**Backend**: `https://chronicle-backend.onrender.com`
**API Docs**: `https://chronicle-backend.onrender.com/docs`

---

## 💰 Cost

**FREE** - $0/month for everything! 🎉

---

**Need more details?** See [DEPLOY_NETLIFY_RENDER.md](DEPLOY_NETLIFY_RENDER.md)
