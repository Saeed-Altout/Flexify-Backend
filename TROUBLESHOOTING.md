# 🔧 Backend Deployment Troubleshooting

## Common Issues and Solutions

### 1. **500 Internal Server Error**

#### Check Vercel Logs:
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on the function that failed
3. Check the logs for specific error messages

#### Common Causes:

**a) Missing Environment Variables**
- Ensure all required environment variables are set in Vercel
- Check `ENV_VARIABLES.md` for the complete list
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct

**b) Module Import Errors**
- The API handler tries to import from `dist/` first, then falls back to `src/`
- Ensure `npm run build` completes successfully
- Check that `dist/` folder contains compiled files

**c) Database Connection Issues**
- Verify Supabase credentials are correct
- Check if Supabase project is active
- Ensure database migrations are run

**d) CORS Configuration**
- Set `CORS_ORIGINS` environment variable
- Include your frontend URL: `https://your-frontend.vercel.app`
- Use `*` for development (not recommended for production)

### 2. **Build Failures**

#### Check Build Logs:
1. Vercel Dashboard → Deployments → Click on failed deployment
2. Check the build logs for TypeScript errors

#### Solutions:
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify dependencies
- Check for TypeScript compilation errors
- Verify `tsconfig.json` is correct

### 3. **Function Timeout**

Vercel has a 10-second timeout for Hobby plan, 60 seconds for Pro.

#### Solutions:
- Optimize database queries
- Use connection pooling
- Cache frequently accessed data
- Consider upgrading to Pro plan for longer timeouts

### 4. **Memory Issues**

#### Symptoms:
- Function crashes with memory errors
- Slow response times

#### Solutions:
- Reduce bundle size
- Lazy load modules
- Optimize imports
- Check for memory leaks

### 5. **Path Resolution Issues**

If you see errors about missing modules:

#### Solution:
- Ensure `api/index.ts` uses correct import paths
- The handler automatically tries `dist/` then `src/`
- Verify build output includes all necessary files

## 🔍 Debugging Steps

### Step 1: Check Environment Variables
```bash
# In Vercel Dashboard → Settings → Environment Variables
# Verify all required variables are set
```

### Step 2: Test Build Locally
```bash
cd server
npm run build
# Check if dist/ folder is created with all files
```

### Step 3: Test API Handler Locally
```bash
# Install vercel CLI
npm i -g vercel

# Test locally
cd server
vercel dev
```

### Step 4: Check Function Logs
- Vercel Dashboard → Functions → View Logs
- Look for error messages
- Check for stack traces

### Step 5: Verify Routes
- Test: `https://your-backend.vercel.app/api/health`
- Should return a response (even if 404, means function is working)

## 📋 Pre-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] `npm run build` succeeds locally
- [ ] `dist/` folder contains compiled files
- [ ] `serverless-http` is in `package.json` dependencies
- [ ] `api/index.ts` exists and is correct
- [ ] `vercel.json` is configured correctly
- [ ] Supabase credentials are valid
- [ ] CORS origins are configured
- [ ] Database migrations are run

## 🚨 Quick Fixes

### If function crashes immediately:
1. Check environment variables (especially Supabase)
2. Verify `NODE_ENV=production` is set
3. Check Vercel function logs

### If 404 errors:
1. Verify route configuration in `vercel.json`
2. Check that `app.setGlobalPrefix('api')` is set
3. Test with `/api/health` endpoint

### If CORS errors:
1. Update `CORS_ORIGINS` with frontend URL
2. Verify CORS configuration in `api/index.ts`
3. Check browser console for specific CORS error

## 📞 Getting Help

1. Check Vercel Function Logs (most important!)
2. Review this troubleshooting guide
3. Check `DEPLOYMENT.md` for setup instructions
4. Verify all environment variables are set correctly

