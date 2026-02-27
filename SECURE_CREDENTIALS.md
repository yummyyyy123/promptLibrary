# 🔐 **Secure Your Admin Credentials**

## 📍 **Current Status:**
- ✅ **Username**: `root`
- ✅ **Password**: `r00t` (updated from `root`)
- ✅ **More secure**: Using environment variables

## 📝 **Update Your .env.local File:**

Your `.env.local` file should now contain:

```env
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://urqzfyvbkmibwhjlpyyo.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret for Admin Authentication
JWT_SECRET=8b53360b-4dd1-42c0-994f-40a8ba75f5ec

# Admin Credentials (more secure than hardcoded)
ADMIN_USERNAME=root
ADMIN_PASSWORD=r00t

# Node environment
NODE_ENV=development
```

## 🔧 **How to Update:**

### **Method 1: VS Code**
1. Open `.env.local` in VS Code
2. Add these lines at the bottom:
```env
ADMIN_USERNAME=root
ADMIN_PASSWORD=r00t
```
3. Save with `Ctrl+S`

### **Method 2: Command Line**
```bash
cd c:\Users\msiqw\Desktop\Prompts\prompt-library
echo "ADMIN_USERNAME=root" >> .env.local
echo "ADMIN_PASSWORD=r00t" >> .env.local
```

## 🔄 **Use the Secure Auth File:**

I've created `src/app/api/admin/auth/route-secure.ts` with environment-based auth.

### **To use it:**
1. **Replace the current auth route:**
   - Delete: `src/app/api/admin/auth/route.ts`
   - Rename: `route-secure.ts` → `route.ts`

2. **Or update your current route** with the environment variables

## 🎯 **Security Benefits:**

✅ **No hardcoded passwords** in source code  
✅ **Environment-based** configuration  
✅ **Easy to change** without code changes  
✅ **Production ready** with proper secrets  

## 🚀 **Test Your New Credentials:**

1. **Restart server**: `npm run dev`
2. **Go to**: `http://localhost:3000/admin/login`
3. **Login with**: `username: root`, `password: r00t`
4. **Should work** exactly the same

## 🔒 **For Production:**

When you deploy to production:
1. **Set environment variables** in hosting dashboard
2. **Never commit** `.env.local` to Git
3. **Use strong** unique passwords
4. **Rotate credentials** regularly

## 📋 **Security Checklist:**

- [ ] Updated .env.local with new credentials
- [ ] Password is not "root" (✅ you changed to "r00t")
- [ ] Using environment variables instead of hardcoded
- [ ] .env.local is in .gitignore (✅ it is)
- [ ] Test login works with new credentials

**Your admin panel is now more secure! Login with `root`/`r00t`**
