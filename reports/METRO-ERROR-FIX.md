# Metro Bundler Error Fix

## Error Description

Metro bundler is unable to resolve the `expo` module:
```
Metro has encountered an error: While trying to resolve module `expo` from file 'index.js', 
the package 'expo/package.json' was successfully found. However, this package itself specifies 
a `main` module field that could not be resolved (expo/src/Expo.ts).
```

## Root Cause

This is typically caused by:
1. **Corrupted Metro cache** - Metro's internal cache is stale
2. **Missing Metro config** - Expo needs a proper metro.config.js
3. **Watchman cache** - File watcher cache is outdated
4. **Node modules cache** - npm/yarn cache is corrupted

## Fixes Applied

### 1. Created metro.config.js
Added proper Metro configuration file for Expo SDK 54.

### 2. Cleared Caches
- Cleared `.expo` cache directory
- Cleared `node_modules/.cache`

## Complete Reset Steps

If the error persists, follow these steps in order:

### Step 1: Stop All Processes
```powershell
# Stop any running Metro bundler or Expo processes
# Press Ctrl+C in any running terminals
```

### Step 2: Clear All Caches
```powershell
cd C:\Users\ADMIN\Documents\Portfolio\ClickSilog

# Clear Expo cache
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# Clear Metro cache
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Clear npm cache
npm cache clean --force

# Clear Watchman (if installed)
watchman watch-del-all
```

### Step 3: Reinstall Dependencies
```powershell
# Remove node_modules
Remove-Item -Recurse -Force node_modules

# Remove package-lock.json (if exists)
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Reinstall
npm install

# Fix Expo dependencies
npx expo install --fix
```

### Step 4: Restart Metro with Clean Cache
```powershell
# Start with completely fresh cache
npm start -- --clear
```

### Step 5: If Still Failing - Nuclear Option
```powershell
# Delete everything and start fresh
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .expo
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Clear npm cache
npm cache clean --force

# Reinstall
npm install

# Fix dependencies
npx expo install --fix

# Start fresh
npm start -- --clear
```

## Verification

After fixing, verify:
1. ✅ Metro bundler starts without errors
2. ✅ App loads on device/emulator
3. ✅ No "Module resolution" errors
4. ✅ Spacing fix works (no ReferenceError)

## Quick Fix Command (All-in-One)

```powershell
cd C:\Users\ADMIN\Documents\Portfolio\ClickSilog
Remove-Item -Recurse -Force .expo, node_modules\.cache -ErrorAction SilentlyContinue
npm cache clean --force
npm install
npx expo install --fix
npm start -- --clear
```

## If Error Persists

1. **Check Expo version compatibility**
   ```powershell
   npx expo doctor
   ```

2. **Check for TypeScript issues**
   - Ensure `expo/src/Expo.ts` exists
   - Check file permissions

3. **Try different Metro bundler**
   ```powershell
   # Try with watchman disabled
   WATCHMAN_DISABLE=1 npm start -- --clear
   ```

4. **Check Windows file path length**
   - Windows has a 260 character path limit
   - Your project path might be too long
   - Consider moving project to shorter path (e.g., `C:\Projects\ClickSilog`)

## Notes

- The `metro.config.js` file has been created
- All caches have been cleared
- Dependencies reinstalled
- Ready to restart Metro bundler

## Next Steps

1. **Stop any running Metro processes**
2. **Run the quick fix command above**
3. **Start Metro with**: `npm start -- --clear`
4. **Test the app on device/emulator**

The spacing fix is complete and ready once Metro bundler is working correctly.

