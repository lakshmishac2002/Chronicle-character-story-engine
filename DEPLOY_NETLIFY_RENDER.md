# 🚀 Deploy Chronicle - Netlify + Render

Simple deployment guide using **Netlify** (frontend) + **Render** (backend).

---

## 📋 What You Need

- ✅ Google API Key: `AIzaSyBXY4wTUbmb8syphseJM5oxod1j4b7CEfw`
- ✅ Render account (free): https://render.com
- ✅ Netlify account (free): https://netlify.com
- ✅ 15 minutes

**Total Cost: $0/month** (100% FREE)

---

## Part 1️⃣: Deploy Backend to Render (7 minutes)

### Step 1: Sign Up for Render

1. Go to **https://render.com**
2. Click **"Get Started"**
3. Sign up with **GitHub** (recommended) or Email
4. Verify your email

### Step 2: Create New Web Service

1. Click **"New +"** (top right)
2. Select **"Web Service"**
3. Choose connection method:

**Option A: Connect GitHub Repository (Recommended)**
- Click **"Connect account"** → Authorize GitHub
- Select your Chronicle repository
- Click **"Connect"**

**Option B: Public Git Repository**
- Choose **"Public Git repository"**
- Enter: Your repository URL
- Click **"Continue"**

### Step 3: Configure Web Service

Fill in the following settings:

```
Name: chronicle-backend
Region: Oregon (US West) or closest to you
Branch: main (or your default branch)
Root Directory: (leave blank)
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn backend:app --host 0.0.0.0 --port $PORT
```

**Instance Type**: Select **"Free"**

### Step 4: Add Environment Variables

Scroll down to **"Environment Variables"**

Click **"Add Environment Variable"**

```
Key: GOOGLE_API_KEY
Value: AIzaSyBXY4wTUbmb8syphseJM5oxod1j4b7CEfw
```

Click **"Add"**

### Step 5: Deploy

1. Scroll to bottom
2. Click **"Create Web Service"**
3. Wait 3-5 minutes for deployment
4. Watch the logs for success

### Step 6: Get Your Backend URL

Once deployed (status shows "Live"):

1. Look at the top of the page
2. Copy your URL: `https://chronicle-backend.onrender.com`
3. **Save this URL** - you'll need it for frontend!

### Step 7: Test Backend

Click on your URL or visit: `https://chronicle-backend.onrender.com/docs`

You should see **FastAPI Swagger Documentation** ✅

---

## Part 2️⃣: Deploy Frontend to Netlify (7 minutes)

### Step 1: Sign Up for Netlify

1. Go to **https://netlify.com**
2. Click **"Sign up"**
3. Sign up with **GitHub** (recommended) or Email

### Step 2: Import Project

1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Authorize Netlify to access GitHub
4. Select your **Chronicle repository**

### Step 3: Configure Build Settings

```
Base directory: chronicle-frontend
Build command: npm run build
Publish directory: chronicle-frontend/build
```

**Important**: Click **"Show advanced"** to add environment variable

### Step 4: Add Environment Variable

Under **"Advanced build settings"**:

Click **"New variable"**

```
Key: REACT_APP_API_URL
Value: https://chronicle-backend.onrender.com
```
(Use YOUR Render URL from Part 1, Step 6)

**Do NOT add a trailing slash!**

### Step 5: Deploy

1. Click **"Deploy [your-site-name]"**
2. Wait 3-5 minutes for build
3. Watch the deploy logs

### Step 6: Get Your Frontend URL

Once deployed (you'll see confetti 🎉):

1. Your site is live at: `https://[random-name].netlify.app`
2. Click **"Open production deploy"** to visit

### Step 7: Customize Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Options"** → **"Edit site name"**
3. Change to: `chronicle-app` (or your preferred name)
4. Your URL becomes: `https://chronicle-app.netlify.app`

---

## Part 3️⃣: Fix CORS (Important!)

Your frontend won't connect to backend without this fix.

### Update Backend CORS Settings

1. Go to your **Render dashboard**
2. Click on **chronicle-backend** service
3. Click **"Shell"** tab (or edit locally and redeploy)

**If editing locally:**

1. Open `d:\Projects\Robo AI project\backend.py`
2. Find line 26-32 (CORS middleware)
3. Update `allow_origins`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://chronicle-app.netlify.app",  # Your actual Netlify URL
        "https://*.netlify.app",  # Allow all Netlify preview deploys
        "http://localhost:3000"  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

4. Save the file
5. Commit and push to GitHub:

```bash
git add backend.py
git commit -m "Update CORS for Netlify deployment"
git push
```

6. Render will **auto-deploy** (if connected to GitHub)
   - Or click **"Manual Deploy"** → **"Deploy latest commit"**

---

## ✅ Test Your Deployment

### Test 1: Backend Health Check

Visit: `https://chronicle-backend.onrender.com/docs`

✅ Should see: FastAPI Swagger UI

### Test 2: Frontend Loads

Visit: `https://chronicle-app.netlify.app`

✅ Should see: Chronicle intro screen with purple gradient

### Test 3: Create Character

1. Click **"Create Your First Character"**
2. Fill in:
   - Name: `Test Hero`
   - Canonical Appearance: `Red hair, blue eyes`
   - Personality: `Brave and curious`
   - Emotional Baseline: `Confident`
   - Immutable Traits: `blue eyes`
3. Click **"Create Character"**

✅ Should see: First scene generates, timeline appears

### Test 4: Edit Scene

1. Type: `Make her smile`
2. Click **"Execute Edit"**

✅ Should see: New scene appears in timeline

### Test 5: Invalid Edit (Should Reject)

1. Type: `Change eye color to green`
2. Click **"Execute Edit"**

✅ Should see: Error message rejecting the edit

---

## 🐛 Troubleshooting

### Issue: "CORS Error" in Browser Console

**Symptoms:**
```
Access to fetch at 'https://chronicle-backend.onrender.com/api/characters'
from origin 'https://chronicle-app.netlify.app' has been blocked by CORS policy
```

**Solution:**
1. Update `backend.py` CORS settings (see Part 3 above)
2. Make sure your Netlify URL is in `allow_origins`
3. Commit and push changes
4. Wait for Render to redeploy (2-3 minutes)

### Issue: "Failed to fetch" or API Connection Error

**Check:**
1. ✅ Backend URL is correct in Netlify environment variables
2. ✅ URL uses `https://` not `http://`
3. ✅ No trailing slash: ✅ `.onrender.com` ❌ `.onrender.com/`

**Fix in Netlify:**
1. Go to **Site settings** → **Environment variables**
2. Find `REACT_APP_API_URL`
3. Click **"Options"** → **"Edit"**
4. Update to correct backend URL
5. Click **"Save"**
6. Go to **Deploys** → Click **"Trigger deploy"** → **"Clear cache and deploy site"**

### Issue: Backend Sleeping (Free Tier)

**Render free tier sleeps after 15 minutes of inactivity**

**Symptoms:**
- First request takes 30-60 seconds
- Subsequent requests are fast

**Solutions:**
1. **Accept it** - It's free! Just wait for wake-up
2. **Ping service** - Use a service like UptimeRobot to ping every 14 minutes
3. **Upgrade to paid** - $7/month for no sleeping

### Issue: Build Failed on Netlify

**Common causes:**
1. Wrong base directory
2. Missing dependencies in package.json
3. Environment variable typo

**Check build logs:**
1. Netlify Dashboard → Deploys → Failed deploy
2. Click on it to see logs
3. Look for error messages

**Fix:**
1. Go to **Site settings** → **Build & deploy** → **Build settings**
2. Verify:
   - Base directory: `chronicle-frontend`
   - Build command: `npm run build`
   - Publish directory: `chronicle-frontend/build`
3. Click **"Save"**
4. Redeploy: **Deploys** → **"Trigger deploy"**

### Issue: Environment Variable Not Working

**For Netlify:**
- Variables MUST start with `REACT_APP_`
- Must redeploy after adding/changing variables
- Clear cache: **Deploys** → **"Trigger deploy"** → **"Clear cache and deploy site"**

**For Render:**
- Changes take effect on next request
- May need to restart: Click **"Manual Deploy"** → **"Clear build cache & deploy"**

---

## 📊 Free Tier Limits

### Render (Backend)
- ✅ 750 hours/month (enough for 1 service)
- ✅ Sleeps after 15 minutes of inactivity
- ✅ 512 MB RAM
- ✅ Auto-deploy from GitHub
- ⚠️ Wakes up in 30-60 seconds on first request

### Netlify (Frontend)
- ✅ 100 GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Unlimited sites
- ✅ Auto-deploy from GitHub
- ✅ Free SSL certificate
- ✅ Custom domain support

### Google Gemini API
- ✅ 1,500 requests/day
- ✅ 60 requests/minute
- ✅ No credit card required

**Total: $0/month** 🎉

---

## 🔄 Update Your Deployment

### Update Backend Code

**Method 1: Auto-deploy (if connected to GitHub)**
1. Make changes to `backend.py`
2. Commit: `git add . && git commit -m "Update backend"`
3. Push: `git push`
4. Render auto-deploys in 2-3 minutes ✅

**Method 2: Manual deploy**
1. Make changes locally
2. Go to Render Dashboard → Your service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Update Frontend Code

**Method 1: Auto-deploy (if connected to GitHub)**
1. Make changes in `chronicle-frontend/src/`
2. Commit: `git add . && git commit -m "Update frontend"`
3. Push: `git push`
4. Netlify auto-deploys in 2-3 minutes ✅

**Method 2: Manual deploy**
1. Make changes locally
2. Go to Netlify Dashboard → Your site
3. Click **Deploys** → **"Trigger deploy"** → **"Deploy site"**

---

## 📱 Your Live URLs

After successful deployment, save these:

**Frontend (User-facing):**
```
https://chronicle-app.netlify.app
```

**Backend API:**
```
https://chronicle-backend.onrender.com
```

**API Documentation:**
```
https://chronicle-backend.onrender.com/docs
```

---

## 🎉 Success Checklist

- [ ] Backend deployed to Render
- [ ] Backend shows "Live" status
- [ ] Backend `/docs` endpoint works
- [ ] Frontend deployed to Netlify
- [ ] Frontend shows "Published" status
- [ ] Frontend loads in browser
- [ ] No CORS errors in console (F12)
- [ ] Can create a character
- [ ] Can edit a scene
- [ ] Invalid edits are rejected
- [ ] Demo character works

---

## 💡 Pro Tips

### 1. Monitor Your Services

**Render:**
- Dashboard shows uptime and logs
- Check logs: Service → Logs tab

**Netlify:**
- Analytics available on free tier
- Check logs: Deploys → Deploy log

### 2. Custom Domain (Optional)

**Frontend (Netlify):**
1. Buy domain (e.g., Namecheap, Google Domains)
2. Netlify → Domain settings → Add custom domain
3. Update DNS records as instructed
4. Free SSL auto-configured ✅

**Backend (Render):**
1. Render → Settings → Custom domain
2. Add: `api.yourdomain.com`
3. Update DNS: CNAME to Render's domain
4. Free SSL auto-configured ✅

### 3. Keep Render Awake

Use **UptimeRobot** (free):
1. Sign up at https://uptimerobot.com
2. Add monitor: `https://chronicle-backend.onrender.com/docs`
3. Interval: 5 minutes
4. Your backend stays awake ✅

---

## 📞 Support

### Render Support
- Docs: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

### Netlify Support
- Docs: https://docs.netlify.com
- Community: https://answers.netlify.com
- Status: https://www.netlifystatus.com

---

## 🎊 Congratulations!

Your Chronicle app is now **LIVE** on the internet! 🚀

Share your creation:
- **App**: `https://chronicle-app.netlify.app`
- **API**: `https://chronicle-backend.onrender.com/docs`

**Deployment Time**: ~15 minutes
**Cost**: $0/month
**Availability**: Worldwide 🌍
