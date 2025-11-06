# Manual Testing Checklist

Use this checklist for comprehensive manual testing before releases.

## Authentication & Navigation

### Login/Logout
- [ ] User can log in with valid credentials
- [ ] Invalid credentials show error message
- [ ] User can log out successfully
- [ ] Session persists after app restart
- [ ] Session expires appropriately

### Role-Based Navigation
- [ ] Customer role redirects to Menu screen
- [ ] Cashier role redirects to Cashier POS screen
- [ ] Kitchen role redirects to Kitchen Display screen
- [ ] Admin role redirects to Admin Dashboard
- [ ] Navigation stack is correct for each role
- [ ] Back button behavior is correct

### Protected Routes
- [ ] Unauthenticated users cannot access protected screens
- [ ] Redirect to login when accessing protected routes
- [ ] Role-based access control works

## Customer Flow

### Menu Screen
- [ ] All menu items display correctly
- [ ] Item images load properly
- [ ] Item names and prices display correctly
- [ ] Category filter buttons work
- [ ] "All" category shows all items
- [ ] Selected category highlights correctly
- [ ] Search bar opens/closes correctly
- [ ] Search filters items correctly
- [ ] Cart button displays in header
- [ ] Cart badge shows correct count
- [ ] Theme toggle works

### Item Customization
- [ ] Customization modal opens on item press
- [ ] Modal displays item name correctly
- [ ] Size selection works for drinks/snacks
- [ ] Add-ons display correctly for meals
- [ ] Quantity increment/decrement works
- [ ] Total price updates correctly
- [ ] Special instructions input works
- [ ] "Add to Cart" button works
- [ ] Modal closes after adding to cart
- [ ] Category-specific customization rules apply:
  - [ ] Meals/Silog: Only specific add-ons shown
  - [ ] Snacks: Only size selection
  - [ ] Drinks: Only size selection
  - [ ] Softdrinks: No customization

### Cart Screen
- [ ] All cart items display correctly
- [ ] Item quantities display correctly
- [ ] Item prices display correctly
- [ ] Subtotal calculates correctly
- [ ] Total calculates correctly
- [ ] Quantity update buttons work
- [ ] Remove item button works
- [ ] Empty cart state displays correctly
- [ ] Back button navigates correctly
- [ ] "Proceed to Payment" button works

### Payment Screen
- [ ] Order summary displays correctly
- [ ] All items listed correctly
- [ ] Add-ons displayed correctly
- [ ] Special instructions displayed correctly
- [ ] Total price displays correctly
- [ ] Payment method selection works:
  - [ ] GCash selection works
  - [ ] Cash selection works
- [ ] "Place Order" button works
- [ ] Order confirmation works
- [ ] Navigation after order works

## Cashier Flow

### Cashier Ordering Screen
- [ ] Header displays correctly
- [ ] Cart button displays correctly
- [ ] Cart icon is centered
- [ ] Cart badge updates correctly
- [ ] Theme toggle works
- [ ] Search bar works
- [ ] Category filter works
- [ ] Quick add buttons display for all items
- [ ] Quick add opens customization modal
- [ ] Items add to cart correctly

### Cashier Payment Screen
- [ ] Cart items display correctly
- [ ] Customer name input works
- [ ] Table number input works
- [ ] Payment method selection works
- [ ] Order confirmation works
- [ ] Navigation after order works
- [ ] Cart clears after order

## Kitchen Flow

### Kitchen Display Screen
- [ ] Orders display in real-time
- [ ] Status tabs work:
  - [ ] Pending tab
  - [ ] Preparing tab
  - [ ] Ready tab
- [ ] Category filter buttons work
- [ ] Category buttons are compact
- [ ] Order cards display correctly
- [ ] Order time displays correctly
- [ ] Order items display correctly
- [ ] Add-ons display correctly
- [ ] Special instructions display correctly
- [ ] "Start" button works
- [ ] "Cancel" button works
- [ ] Buttons fit within card
- [ ] Status updates in real-time
- [ ] Empty state displays correctly

## Admin Flow

### Admin Dashboard
- [ ] All menu items display correctly
- [ ] Navigation to sub-screens works

### Menu Management
- [ ] All menu items display correctly
- [ ] "Add Menu Item" button works
- [ ] Add modal opens correctly
- [ ] Form inputs work
- [ ] Category selection works
- [ ] Save button works
- [ ] Edit button works
- [ ] Edit modal opens with data
- [ ] Disable/Enable button works
- [ ] Button text doesn't wrap
- [ ] Delete button works
- [ ] Delete confirmation works
- [ ] Status badge displays correctly

### Add-ons Management
- [ ] Category tabs work
- [ ] Category tabs are tall enough
- [ ] Add-ons display correctly
- [ ] "Add New Add-on" button works
- [ ] Add modal opens correctly
- [ ] Form inputs work
- [ ] Category selection works
- [ ] Save button works
- [ ] Edit button works
- [ ] Disable/Enable button works
- [ ] Delete button works
- [ ] All add-ons visible without clicking

### Sales Report
- [ ] Screen loads without errors
- [ ] Sales data displays correctly
- [ ] Date filters work
- [ ] Charts/graphs display correctly

## UI/UX

### Theme System
- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] Theme toggle works instantly
- [ ] Theme persists after restart
- [ ] All screens adapt to theme
- [ ] Text is readable in both themes
- [ ] Icons display correctly in both themes
- [ ] No white backgrounds on icons in light mode

### Typography
- [ ] Poppins font loads correctly
- [ ] Font weights display correctly
- [ ] Text sizes are consistent
- [ ] Text doesn't wrap unexpectedly
- [ ] Text is readable at all sizes

### Layout & Spacing
- [ ] All buttons are properly sized
- [ ] Icons are centered in buttons
- [ ] Spacing is consistent
- [ ] Cards have proper padding
- [ ] No overlapping elements
- [ ] Layout works on different screen sizes

### Animations
- [ ] Button press animations work
- [ ] Modal animations are smooth
- [ ] Transitions are smooth
- [ ] No lag or stuttering

### Icons
- [ ] All icons display correctly
- [ ] Icons are properly sized
- [ ] Icons are centered
- [ ] No white backgrounds on icons
- [ ] Icon colors match theme

## Error Handling

### Error Boundary
- [ ] Error boundary catches errors
- [ ] Error screen displays correctly
- [ ] "Try Again" button works
- [ ] Errors are logged

### Network Errors
- [ ] Network errors show user-friendly message
- [ ] App doesn't crash on network errors
- [ ] Retry functionality works

### Validation Errors
- [ ] Invalid inputs show error messages
- [ ] Required fields validated
- [ ] Form submission prevented with invalid data

### Empty States
- [ ] Empty cart displays correctly
- [ ] Empty menu displays correctly
- [ ] Empty order list displays correctly
- [ ] Empty states have helpful messages

## Performance

### Loading States
- [ ] Loading indicators display
- [ ] Data loads in reasonable time
- [ ] No blank screens during load

### Real-time Updates
- [ ] Orders update in real-time
- [ ] Cart updates instantly
- [ ] Status changes update immediately

### Memory
- [ ] No memory leaks
- [ ] App doesn't slow down over time
- [ ] Images load efficiently

## Accessibility

### Screen Reader
- [ ] All buttons are accessible
- [ ] Text is readable
- [ ] Navigation is logical

### Touch Targets
- [ ] All buttons are large enough
- [ ] Buttons are easy to tap
- [ ] No accidental taps

## Edge Cases

### Empty Data
- [ ] Empty cart
- [ ] Empty menu
- [ ] Empty order list

### Large Data
- [ ] Many menu items
- [ ] Large cart
- [ ] Many orders

### Rapid Interactions
- [ ] Rapid button presses
- [ ] Rapid navigation
- [ ] Rapid add to cart

### Offline Mode
- [ ] App handles offline gracefully
- [ ] Error messages display
- [ ] Data syncs when online

## Browser/Device Testing

### iOS
- [ ] App runs on iOS simulator
- [ ] All features work
- [ ] UI displays correctly

### Android
- [ ] App runs on Android emulator
- [ ] All features work
- [ ] UI displays correctly

### Different Screen Sizes
- [ ] Small screens (iPhone SE)
- [ ] Medium screens (iPhone 12)
- [ ] Large screens (iPad)
- [ ] Tablets

## Notes

Document any issues found during testing:

### Issues Found:
1. 
2. 
3. 

### Fixed Issues:
1. 
2. 
3. 

### Tested By:
- Name: ___________
- Date: ___________
- Version: ___________

