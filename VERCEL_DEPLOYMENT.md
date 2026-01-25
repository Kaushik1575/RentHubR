# 🚀 Vercel Deployment Guide for RentHub

## ✅ Configuration Complete!

Your `vercel.json` is configured with:
- **Backend URL**: `https://renthubr.onrender.com`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite

---

## 📋 Quick Deploy Steps

### Method 1: Deploy via Vercel Dashboard (Recommended)

#### 1️⃣ Go to Vercel
```
https://vercel.com/
```
- Sign in with your GitHub account

#### 2️⃣ Import Your Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository: `Kaushik1575/RentHubR`
3. Vercel will detect it's a monorepo

#### 3️⃣ Configure Project Settings
**Root Directory:**
```
frontend
```

**Framework Preset:**
```
Vite
```

**Build Settings** (Auto-detected from vercel.json):
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

#### 4️⃣ Add Environment Variables
Click **"Environment Variables"** and add:

```
VITE_RAZORPAY_KEY_ID = rzp_test_S4F1Tr5A1dzGUj
VITE_API_URL = https://renthubr.onrender.com
```

**Important:** Add these for all environments (Production, Preview, Development)

#### 5️⃣ Deploy!
- Click **"Deploy"**
- Wait 2-3 minutes for build to complete
- You'll get a URL like: `https://your-project.vercel.app`

---

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to frontend folder
cd frontend

# Deploy to production
vercel --prod
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? **renthub** (or your choice)
- In which directory is your code located? **.**
- Want to override settings? **N**

---

## 🔧 Configuration Files

### ✅ vercel.json (Already Configured)
```json
{
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "installCommand": "npm install",
    "framework": "vite",
    "rewrites": [
        {
            "source": "/api/:match*",
            "destination": "https://renthubr.onrender.com/api/:match*"
        },
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ]
}
```

### ✅ Environment Variables (.env)
```env
VITE_RAZORPAY_KEY_ID=rzp_test_S4F1Tr5A1dzGUj
VITE_API_URL=https://renthubr.onrender.com
```

---

## 🔄 After Deployment

### Update Backend CORS

Once you get your Vercel URL, update your backend:

1. Go to **Render Dashboard**: https://dashboard.render.com/
2. Select your backend service
3. Go to **Environment** tab
4. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-project.vercel.app
   ```
5. Save (Render will auto-redeploy)

---

## 📊 Vercel vs Netlify

| Feature | Vercel | Netlify |
|---------|--------|---------|
| Config File | `vercel.json` ✅ | `netlify.toml` |
| Syntax | JSON (easier) | TOML |
| Auto-detect | Better for React/Next.js | Good for all |
| Speed | Very fast | Fast |
| Free Tier | 100GB bandwidth | 100GB bandwidth |

**Vercel is great for React/Vite projects!** ✅

---

## ✅ Pre-Deployment Checklist

- [x] `vercel.json` configured
- [x] Backend URL set: `https://renthubr.onrender.com`
- [x] `.env` file has correct values
- [x] `.gitignore` excludes `.env` files
- [x] Build tested locally
- [ ] Push latest changes to GitHub
- [ ] Deploy on Vercel
- [ ] Update backend `FRONTEND_URL`

---

## 🚀 Deploy Now!

### Option A: Dashboard (Easiest)
1. Go to: https://vercel.com/new
2. Import `Kaushik1575/RentHubR`
3. Set root directory: `frontend`
4. Add environment variables
5. Click Deploy!

### Option B: CLI (Fastest)
```bash
cd frontend
vercel --prod
```

---

## 🆘 Troubleshooting

### Build Fails
**Error:** "Command failed"
- Check build logs in Vercel dashboard
- Ensure `package.json` has `build` script
- Verify Node version compatibility

### API Calls Don't Work
**Error:** CORS or 404 errors
- Check `VITE_API_URL` in Vercel environment variables
- Verify backend is running: https://renthubr.onrender.com
- Update backend `FRONTEND_URL` with Vercel URL

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Redeploy after adding environment variables
- Check all environments are set (Production, Preview, Development)

### 404 on Page Refresh
- Check `vercel.json` has the SPA rewrite rule
- Should be working with current config ✅

---

## 📱 Vercel Features

### Automatic Deployments
- Every push to `main` → Production deployment
- Every PR → Preview deployment
- Instant rollbacks available

### Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration steps

### Analytics (Optional)
- Enable Vercel Analytics for performance monitoring
- Free tier includes basic analytics

---

## 🎯 Your URLs

**Backend (Render):**
```
https://renthubr.onrender.com
```

**Frontend (Vercel):**
```
https://__________.vercel.app (you'll get this after deployment)
```

---

## 📝 Important Notes

1. **Vercel auto-detects Vite** - No need for complex configuration
2. **Environment variables** - Must be set in Vercel dashboard
3. **API rewrites** - Configured in `vercel.json` to proxy to Render
4. **Automatic HTTPS** - Vercel provides SSL certificates automatically
5. **Git integration** - Auto-deploys on every push to main branch

---

## ✨ Next Steps

1. **Push changes to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com/new
   - Import your repository
   - Follow the steps above

3. **Update backend**
   - Add Vercel URL to Render environment variables

4. **Test your application**
   - Check all features work
   - Verify API calls succeed
   - Test payment flow

---

## 🎉 You're Ready!

Your configuration is complete. Just deploy on Vercel and you're live! 🚀

**Good luck with your deployment!** ✨
