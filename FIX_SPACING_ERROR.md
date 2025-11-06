# Fix: ReferenceError - Property 'spacing' doesn't exist

## Problem
The error `ReferenceError: Property 'spacing' doesn't exist` occurred because `spacing` was referenced in a `StyleSheet.create()` block where it's not available.

## Root Cause
In `src/screens/customer/PaymentScreen.js`, line 629 had:
```javascript
discountApplied: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm  // ❌ ERROR: spacing not available in StyleSheet.create scope
},
```

The `spacing` variable is only available inside the component where `useTheme()` is called, not in the `StyleSheet.create()` block which runs at module load time.

## Solution
1. **Removed `gap: spacing.sm` from StyleSheet.create block**
   - Changed line 629 to a comment: `// gap handled inline via theme`

2. **Added gap inline in the component**
   - Updated line 267 to: `<View style={[styles.discountApplied, { gap: spacing.sm }]}>`
   - This ensures `spacing` is accessed where it's available (inside the component)

## Files Fixed
- ✅ `src/screens/customer/PaymentScreen.js`
  - Line 629: Removed `gap: spacing.sm` from StyleSheet
  - Line 267: Added `gap: spacing.sm` inline in component

## Verification
- ✅ No linting errors
- ✅ All other `spacing` usages are correctly inside component code
- ✅ No other StyleSheet.create blocks have spacing references

## Prevention
Always remember:
- **StyleSheet.create()** runs at module load time - no access to component context
- **spacing** comes from `useTheme()` hook - only available inside component
- Use inline styles for dynamic values: `style={[styles.base, { gap: spacing.sm }]}`

## Testing
To verify the fix works:
1. Clear Metro cache: `npm start -- --clear`
2. Restart the app
3. Navigate to Payment screen
4. Apply a discount code
5. Verify discount section displays correctly without errors

---

**Fixed:** $(date)
**Status:** ✅ Resolved

