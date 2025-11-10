# Metro Bundler Connection Fix

## Issue
The app can't connect to Metro bundler at `http://192.168.254.110:8081/index`

## Solution

### Option 1: Restart Metro with Cleared Cache (Recommended)

1. **Stop the current Metro bundler:**
   - Find the terminal where Metro is running
   - Press `Ctrl+C` to stop it

2. **Restart with cleared cache:**
   ```bash
   npm run start:clear
   ```
   Or:
   ```bash
   npm start -- --clear
   ```

3. **Reload the app:**
   - Shake your device/emulator
   - Select "Reload" from the menu
   - Or press `R` in the Metro bundler terminal

### Option 2: Check Network Connection

1. **Verify your device/emulator is on the same network:**
   - Check your computer's IP address: `ipconfig` (Windows)
   - Make sure your device can reach `192.168.254.110:8081`

2. **If using Android Emulator:**
   - Use `10.0.2.2:8081` instead of your local IP
   - Or use `localhost:8081` if using Genymotion

3. **If using physical device:**
   - Make sure both device and computer are on the same Wi-Fi
   - Check firewall isn't blocking port 8081

### Option 3: Use Tunnel Mode (If network issues persist)

```bash
npm start -- --tunnel
```

This uses Expo's tunnel service to connect, which works even if devices are on different networks.

### Option 4: Kill and Restart Metro

1. **Kill all Node processes:**
   ```bash
   # Windows PowerShell
   Get-Process -Name node | Stop-Process -Force
   ```

2. **Clear Metro cache:**
   ```bash
   npm start -- --clear
   ```

3. **Restart the app**

## Common Issues

### Issue: "Could not connect to development server"

**Solutions:**
- Restart Metro bundler
- Check firewall settings
- Verify network connection
- Try tunnel mode: `npm start -- --tunnel`

### Issue: "Socket TimeoutException"

**Solutions:**
- Restart Metro bundler with cleared cache
- Check if port 8081 is blocked
- Try a different port: `npm start -- --port 8082`

### Issue: App connects but shows "Unable to load script"

**Solutions:**
- Clear Metro cache: `npm start -- --clear`
- Clear app cache (uninstall and reinstall app)
- Check for JavaScript errors in Metro bundler terminal

## Quick Fix Commands

```bash
# Stop Metro and restart with cleared cache
npm run start:clear

# Or if using dev client
npm run start:dev:clear

# Use tunnel mode (works across networks)
npm start -- --tunnel

# Use different port
npm start -- --port 8082
```

## After Fixing

1. **Reload the app:**
   - Shake device → Reload
   - Or press `R` in Metro terminal

2. **Verify connection:**
   - Check Metro bundler terminal for "Connected" message
   - App should load without errors

## Still Having Issues?

1. **Check Metro bundler logs** for errors
2. **Verify environment variables** are loaded correctly
3. **Check firewall** isn't blocking port 8081
4. **Try tunnel mode** as a workaround
5. **Restart your computer** if all else fails

