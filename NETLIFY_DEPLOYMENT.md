# 🚀 **Deploy to Netlify - Complete Guide**

## 📋 **Step 1: Create Netlify Account**

1. **Go to [netlify.com](https://netlify.com)**
2. **Sign up** free (GitHub, GitLab, Bitbucket, or email)
3. **Verify email** if required

## 🔗 **Step 2: Connect Your Repository**

### **Option A: GitHub Integration (Recommended)**
1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/prompt-library.git
   git push -u origin main
   ```

2. **In Netlify dashboard**:
   - Click **"Add new site"**
   - Choose **"Import an existing project"**
   - Select **GitHub**
   - Authorize Netlify access
   - Choose your `prompt-library` repository

### **Option B: Manual Drag & Drop**
1. **Drag your project folder** to Netlify deploy area
2. **Netlify will auto-detect** Next.js app

## ⚙️ **Step 3: Configure Environment Variables**

In Netlify dashboard:
1. **Go to Site settings** → **"Build & deploy"**
2. **Click "Environment"** or **"Environment variables"**
3. **Add these variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://urqzfyvbkmibwhjlpyyo.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=8b53360b-4dd1-42c0-994f-40a8ba75f5ec
ADMIN_USERNAME=root
ADMIN_PASSWORD=r00t
```

## 🏗️ **Step 4: Build Settings**

Netlify will auto-detect Next.js, but verify:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: `18`

## 🌐 **Step 5: Deploy!**

### **Automatic Deployments**
- **Every push** to GitHub triggers new build
- **Pull requests** create preview deployments
- **Main branch** updates production site

### **Manual Deploy**
- Click **"Deploy site"** in Netlify dashboard
- **Build takes 2-3 minutes**

## 🎯 **Your Netlify URLs**

After deployment, you'll get:
- **Production**: `https://your-site-name.netlify.app`
- **Admin**: `https://your-site-name.netlify.app/admin`
- **API**: `https://your-site-name.netlify.app/api/*`

## 🆓 **Netlify Free Tier Features**

### ✅ **What You Get:**
- **100GB bandwidth/month**
- **300 build minutes/month**
- **Unlimited sites**
- **SSL certificates** (automatic)
- **Custom domains** (free)
- **Form handling** (free)
- **Serverless functions** (free)

### 📊 **Limits:**
- **Function execution**: 125ms max (free tier)
- **Memory**: 1GB max per function
- **Concurrent builds**: 1 at a time

## 🔧 **Troubleshooting**

### **Build Failures:**
```bash
# Check Next.js version
npx next --version

# Clean build
rm -rf .next
npm run build
```

### **API Issues:**
- **Functions timeout**: Increase timeout in netlify.toml
- **Environment variables**: Check spelling in Netlify dashboard
- **CORS issues**: Already handled in netlify.toml

### **Routing Issues:**
- **Admin routes**: Handled by redirects in netlify.toml
- **API routes**: Redirected to Netlify functions

## 🚀 **Quick Deploy Commands**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=.next

# Or link to GitHub for auto-deploys
netlify link
```

## 🎨 **Custom Domain (Optional)**

1. **Buy domain** (GoDaddy, Namecheap, etc.)
2. **In Netlify**: Site settings → **"Domain management"**
3. **Add custom domain**
4. **Update DNS records** (Netlify provides instructions)

## 📱 **Mobile & Performance**

### **Netlify Optimizations:**
- ✅ **Automatic HTTPS**
- ✅ **Global CDN** (fast loading)
- ✅ **Image optimization**
- ✅ **Minification**
- ✅ **Gzip compression**

## 🔒 **Security Features**

- ✅ **HTTPS everywhere**
- ✅ **Security headers** (configured in netlify.toml)
- ✅ **Environment variable protection**
- ✅ **No server maintenance**

## 🎯 **Production Checklist**

Before going live:
- [ ] Environment variables set in Netlify
- [ ] Custom domain configured (if needed)
- [ ] Test all functionality on deployed site
- [ ] Check admin login works
- [ ] Verify Supabase connection
- [ ] Test prompt submission flow

## 🆘 **Common Issues & Solutions**

### **"Page not found" errors:**
- Check netlify.toml redirects
- Verify build output directory
- Check trailing slashes in URLs

### **Environment variables not working:**
- Variables are case-sensitive
- Check for typos in Netlify dashboard
- Restart build after adding variables

### **API routes not working:**
- Functions need time to deploy
- Check function logs in Netlify dashboard
- Verify redirect rules in netlify.toml

## 🎉 **You're Ready!**

Your prompt library will be live at:
- **Free hosting** on Netlify
- **Global CDN** for fast loading
- **Automatic HTTPS** security
- **Git integration** for easy updates
- **Supabase database** for data storage

**Deploy now and share your prompt library with the world! 🚀**
