# 🚀 Deploy Chronicle - Simple Guide

**Netlify (Frontend) + Render (Backend) - 100% FREE**

---

## ⚠️ IMPORTANT: Fix Dependencies First!

I've already updated your `requirements.txt` to fix the Render build error.

**Push these changes to GitHub**:
```bash
cd "d:\Projects\Robo AI project"
git add requirements.txt runtime.txt
git commit -m "Fix Render dependencies"
git push
```

---

## Part 1: Deploy Backend to Render

### 1. Sign Up
- Go to **https://render.com**
- Sign up with **GitHub**

### 2. Create Web Service
- Click **"New +"** → **"Web Service"**
- Click **"Connect account"** → Authorize GitHub
- Select your **Chronicle repository**
- Click **"Connect"**

### 3. Configure Service

**Fill in these settings**:

| Setting | Value |
|---------|-------|
| **Name** | `chronicle-backend` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | (leave blank) |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install --upgrade pip && pip install -r requirements.txt` |
| **Start Command** | `uvicorn backend:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | **Free** |

### 4. Add Environment Variable

Scroll to **"Environment Variables"**

Click **"Add Environment Variable"**:
- **Key**: `GOOGLE_API_KEY`
- **Value**: `AIzaSyBXY4wTUbmb8syphseJM5oxod1j4b7CEfw`

### 5. Deploy!

- Click **"Create Web Service"**
- Wait **3-5 minutes** (watch the logs)
- Status should show **"Live"** ✅

### 6. Copy Your Backend URL

At the top of the page, copy your URL:
```
https://chronicle-backend.onrender.com
```
(Your actual URL will be different)

### 7. Test Backend

Visit: `https://your-backend-url.onrender.com/docs`

You should see **FastAPI Swagger UI** ✅

---

## Part 2: Deploy Frontend to Netlify

### 1. Sign Up
- Go to **https://netlify.com**
- Sign up with **GitHub**

### 2. Import Project
- Click **"Add new site"** → **"Import an existing project"**
- Choose **"Deploy with GitHub"**
- Select your **Chronicle repository**

### 3. Configure Build

**Fill in these settings**:

| Setting | Value |
|---------|-------|
| **Base directory** | `chronicle-frontend` |
| **Build command** | `npm run build` |
| **Publish directory** | `chronicle-frontend/build` |

### 4. Add Environment Variable

Click **"Show advanced"** → **"New variable"**:
- **Key**: `REACT_APP_API_URL`
- **Value**: `https://your-backend-url.onrender.com`
  _(Use YOUR actual Render URL from Part 1, Step 6)_

**Important**:
- ✅ Use `https://` (not `http://`)
- ✅ NO trailing slash

### 5. Deploy!

- Click **"Deploy site"**
- Wait **3-5 minutes**
- You'll see confetti 🎉 when done

### 6. Your App is Live!

Your URL: `https://random-name.netlify.app`

**Optional**: Customize the URL:
- Site settings → Domain management
- Click "Options" → "Edit site name"
- Change to: `chronicle-app`
- New URL: `https://chronicle-app.netlify.app`

---

## Part 3: Fix CORS (Required!)

Without this, your frontend won't connect to backend.

### 1. Update backend.py

Open: `d:\Projects\Robo AI project\backend.py`

Find line **28** (in the CORS middleware section)

Change:
```python
allow_origins=["*"],  # In production, specify your frontend domain
```

To:
```python
allow_origins=[
    "https://chronicle-app.netlify.app",  # Your actual Netlify URL
    "https://*.netlify.app",  # For preview deploys
    "http://localhost:3000"  # Local development
],
```

### 2. Save and Push

```bash
git add backend.py
git commit -m "Add Netlify CORS"
git push
```

### 3. Wait for Redeploy

Render will **auto-deploy** in **2-3 minutes** ✅

---

## ✅ Test Your App!

### 1. Visit Your App
```
https://chronicle-app.netlify.app
```

### 2. Open Browser Console
Press **F12** to check for errors

### 3. Create a Character

Click **"Create Your First Character"**

Fill in:
- **Name**: Test Hero
- **Canonical Appearance**: Red hair, blue eyes
- **Personality**: Brave and curious
- **Emotional Baseline**: Confident
- **Immutable Traits**: blue eyes

Click **"Create Character"**

✅ First scene should generate!

### 4. Edit a Scene

Type: `Make her smile`

Click **"Execute Edit"**

✅ New scene should appear!

### 5. Try Invalid Edit

Type: `Change eye color to green`

Click **"Execute Edit"**

✅ Should be **rejected** with explanation!

---

## 🐛 Troubleshooting

### "CORS Error" in Console

**Check**:
- Did you update `backend.py` line 28?
- Did you git push?
- Did Render redeploy? (check dashboard)

**Fix**:
1. Verify your Netlify URL in `backend.py`
2. Make sure it matches exactly
3. Push to GitHub again
4. Wait for Render to redeploy

### "Failed to fetch" Error

**Check**:
1. Netlify → Site settings → Environment variables
2. Verify `REACT_APP_API_URL` is correct
3. Should be: `https://your-backend.onrender.com`
4. NO trailing slash

**Fix**:
1. Update the environment variable
2. Netlify → Deploys → Trigger deploy → Clear cache and deploy

### Backend Sleeping

**This is normal for free tier!**

- Backend sleeps after 15 minutes of no activity
- First request takes 30-60 seconds to wake up
- Subsequent requests are fast

**Want to keep it awake?**
Use **UptimeRobot** (free): https://uptimerobot.com
- Add monitor: Your Render URL
- Ping every 5 minutes

---

## 📱 Your Live URLs

**Save these**:

- **Frontend**: `https://chronicle-app.netlify.app`
- **Backend**: `https://chronicle-backend.onrender.com`
- **API Docs**: `https://chronicle-backend.onrender.com/docs`

---

## 💰 Cost

**$0/month** - Completely FREE! 🎉

- Render: 750 free hours/month
- Netlify: 100 GB bandwidth
- Google Gemini: 1,500 requests/day

---

## 🔄 Update Your App

### Update Backend

1. Edit `backend.py`
2. Commit: `git commit -am "Update backend"`
3. Push: `git push`
4. Render auto-deploys ✅

### Update Frontend

1. Edit files in `chronicle-frontend/src/`
2. Commit: `git commit -am "Update frontend"`
3. Push: `git push`
4. Netlify auto-deploys ✅

---

## 🎉 Congratulations!

Your Chronicle app is **LIVE** and accessible worldwide! 🌍

**Share it with friends:**
- Frontend: https://chronicle-app.netlify.app
- API: https://chronicle-backend.onrender.com/docs

---

## 📞 Need Help?

- **Build errors**: Check [RENDER_FIX.md](RENDER_FIX.md)
- **Render support**: https://community.render.com
- **Netlify support**: https://answers.netlify.com
