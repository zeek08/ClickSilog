# Build Commands - Important Notes

## ⚠️ Run Commands from Project Root

**All build commands must be run from the project root directory**, not from the `functions` directory.

### ❌ Wrong (from functions directory):
```bash
cd functions
npm run build:android:dev  # ❌ This won't work!
```

### ✅ Correct (from project root):
```bash
cd C:\Users\ADMIN\Documents\Portfolio\ClickSilog
npm run build:android:dev  # ✅ This works!
```

---

## 📍 Current Directory Check

If you see:
```
npm error Missing script: "build:android:dev"
```

**You're in the wrong directory!**

**Solution:**
```powershell
# Navigate to project root
cd C:\Users\ADMIN\Documents\Portfolio\ClickSilog

# Then run your command
npm run build:android:dev
```

---

## 🚀 Development Build Commands

### From Project Root:

```bash
# Build development client (one time)
npm run build:android:dev    # Android
npm run build:ios:dev         # iOS

# Start development server
npm run start:dev             # With dev client
npm run start:dev:clear       # With cleared cache
```

### From Functions Directory:

```bash
# Deploy Firebase functions
firebase deploy --only functions
```

---

## 📁 Directory Structure

```
ClickSilog/                    ← Project Root (run build commands here)
├── package.json              ← Contains build:android:dev script
├── functions/                ← Firebase Functions (separate)
│   ├── package.json          ← Different scripts
│   └── .eslintrc.js
└── src/
```

---

## 🔧 Quick Fix

If you're in the `functions` directory:

```powershell
# Go back to root
cd ..

# Now run your command
npm run build:android:dev
```

---

**Remember:** Always check your current directory with `pwd` (Linux/Mac) or `cd` (Windows) before running build commands!

