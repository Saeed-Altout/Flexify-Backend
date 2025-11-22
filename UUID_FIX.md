# UUID ESM Fix

## Problem
The `uuid` package v13+ is ESM-only and cannot be used with CommonJS `require()`. This causes errors when deploying to Vercel.

## Solution
Downgraded `uuid` from v13.0.0 to v9.0.1, which supports CommonJS.

## Changes Made
- `uuid`: `^13.0.0` → `^9.0.1`
- `@types/uuid`: `^10.0.0` → `^9.0.8`

## Next Steps
1. Run `npm install` in the server directory
2. Redeploy to Vercel
3. The error should be resolved

## Alternative Solutions (if needed)
If you need uuid v13+ features, you could:
1. Change TypeScript config to output ES modules
2. Use dynamic `import()` for uuid
3. Use a different UUID library that supports CommonJS

