# Android Emulator Stuck at Bundling 100% - Fix Guide

## Problem
- Android Studio emulator stuck at "Bundling 100%"
- Full white screen
- App won't load

## Common Causes
1. Metro bundler crashed or not running
2. Cache issues
3. Port conflicts
4. Network connectivity issues
5. App crash on startup

## Solution Steps

### Step 1: Stop Metro Bundler
1. Find the terminal where Metro bundler is running
2. Press `Ctrl+C` to stop it
3. Wait for it to fully stop

### Step 2: Clear Metro Cache and Restart
Run these commands:

```bash
# Clear Metro cache
npm start -- --clear

# Or if using Expo
npx expo start --clear

# Or if using React Native CLI
npx react-native start --reset-cache
```

### Step 3: Restart Android Emulator
1. In Android Studio, close the emulator
2. Restart the emulator
3. Wait for it to fully boot

### Step 4: Reload the App
1. In the Metro bundler terminal, press `r` to reload
2. Or shake the emulator and tap "Reload"
3. Or press `Ctrl+M` in emulator and tap "Reload"

## Alternative Solutions

### Solution 1: Kill All Node Processes
If Metro bundler is stuck, kill all Node processes:

**Windows PowerShell:**
```powershell
# Kill all Node processes
Get-Process node | Stop-Process -Force

# Then restart Metro
npm start -- --clear
```

**Windows CMD:**
```cmd
taskkill /F /IM node.exe
npm start -- --clear
```

### Solution 2: Use Tunnel Mode
If network issues persist, use tunnel mode:

```bash
npm start -- --tunnel --clear
```

### Solution 3: Check Port 8081
Make sure port 8081 is not in use:

**Windows PowerShell:**
```powershell
# Check if port 8081 is in use
netstat -ano | findstr :8081

# Kill process using port 8081 (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Solution 4: Reset Android Emulator
1. In Android Studio, go to **Tools → AVD Manager**
2. Click **Wipe Data** on your emulator
3. Restart the emulator
4. Reload the app

### Solution 5: Check for Errors
1. Check Metro bundler terminal for errors
2. Check Android Studio Logcat for errors:
   - **View → Tool Windows → Logcat**
   - Filter by your app package name
   - Look for red errors

### Solution 6: Reinstall Dependencies
If nothing works, reinstall dependencies:

```bash
# Clean install
rm -rf node_modules
npm install

# Or with yarn
rm -rf node_modules
yarn install

# Then restart Metro
npm start -- --clear
```

## Quick Fix Commands

### Windows PowerShell:
```powershell
# Kill all Node processes
Get-Process node | Stop-Process -Force

# Clear Metro cache and start
cd C:\Users\ADMIN\Documents\Portfolio\ClickSilog
npm start -- --clear
```

### Windows CMD:
```cmd
taskkill /F /IM node.exe
cd C:\Users\ADMIN\Documents\Portfolio\ClickSilog
npm start -- --clear
```

## Step-by-Step Fix

1. **Stop Metro Bundler**
   - Press `Ctrl+C` in Metro terminal
   - Wait for it to stop

2. **Kill Node Processes**
   ```powershell
   Get-Process node | Stop-Process -Force
   ```

3. **Clear Cache and Restart**
   ```bash
   npm start -- --clear
   ```

4. **Reload App in Emulator**
   - Press `r` in Metro terminal
   - Or shake emulator and tap "Reload"

5. **If Still Stuck**
   - Close and restart Android emulator
   - Try tunnel mode: `npm start -- --tunnel --clear`

## Prevention

To prevent this in the future:
1. Always stop Metro bundler properly (Ctrl+C)
2. Clear cache regularly: `npm start -- --clear`
3. Keep Android Studio and emulator updated
4. Don't close Metro bundler terminal abruptly

## Still Not Working?

If none of these work:
1. Check Metro bundler terminal for specific errors
2. Check Android Studio Logcat for app errors
3. Try creating a new emulator instance
4. Check if your app code has any startup errors
5. Verify your `package.json` scripts are correct

## Common Errors

### "Port 8081 already in use"
```powershell
# Find and kill process using port 8081
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

### "Metro bundler not responding"
```bash
# Kill all Node processes and restart
Get-Process node | Stop-Process -Force
npm start -- --clear
```

### "App crashes on startup"
- Check Logcat for errors
- Check Metro bundler for bundle errors
- Verify all dependencies are installed

