# Testing Documentation

## Overview

This document outlines the comprehensive testing strategy for the ClickSilog application, including automated tests, manual testing procedures, and quality assurance practices.

## Test Structure

```
src/
├── __tests__/
│   ├── components/          # Component tests
│   ├── contexts/            # Context tests
│   ├── screens/             # Screen tests
│   ├── services/            # Service tests
│   └── utils/               # Utility tests & helpers
```

## Running Tests

### Unit Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### CI/CD Mode
```bash
npm run test:ci
```

## Test Coverage Goals

- **Statements**: 60%+
- **Branches**: 60%+
- **Functions**: 60%+
- **Lines**: 60%+

## Test Types

### 1. Unit Tests
Test individual components, functions, and utilities in isolation.

**Example Files:**
- `src/__tests__/components/ui/Icon.test.js`
- `src/__tests__/components/ui/AnimatedButton.test.js`
- `src/__tests__/contexts/CartContext.test.js`

### 2. Integration Tests
Test how multiple components work together.

**Example Files:**
- `src/__tests__/screens/cashier/CashierOrderingScreen.test.js`
- `src/__tests__/components/ui/ItemCustomizationModal.test.js`

### 3. E2E Tests (Future)
End-to-end tests using Detox or similar tools.

**Setup Required:**
```bash
npm install --save-dev detox
```

## Test Utilities

### renderWithProviders
Renders components with all necessary providers (Theme, Auth, Cart).

```javascript
import { renderWithProviders } from '../utils/testHelpers';

const { getByText } = renderWithProviders(
  <MyComponent />,
  { themeMode: 'dark', userRole: 'cashier' }
);
```

### Mock Helpers
- `createMockMenuItem()` - Creates mock menu item
- `createMockAddOn()` - Creates mock add-on
- `createMockOrder()` - Creates mock order
- `mockNavigation` - Mock navigation object
- `mockRoute` - Mock route object

## Writing Tests

### Component Test Example
```javascript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Expected Text')).toBeDefined();
  });

  it('should handle button press', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MyComponent onPress={onPress} />);
    fireEvent.press(getByText('Button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

## Manual Testing Checklist

### Authentication & Navigation
- [ ] Login/logout works correctly
- [ ] Role-based navigation redirects properly
- [ ] Protected routes require authentication
- [ ] Navigation stack is correct

### Customer Flow
- [ ] Menu items display correctly
- [ ] Category filtering works
- [ ] Search functionality works
- [ ] Item customization modal opens/closes
- [ ] Add to cart functionality
- [ ] Cart screen displays items correctly
- [ ] Quantity updates work
- [ ] Remove from cart works
- [ ] Payment screen displays correctly
- [ ] Order placement works

### Cashier Flow
- [ ] Quick add buttons work
- [ ] Cart icon displays correctly
- [ ] Cart count badge updates
- [ ] Customer name/table input works
- [ ] Payment method selection works
- [ ] Order confirmation works

### Kitchen Flow
- [ ] Orders display in real-time
- [ ] Status filters work
- [ ] Start/Cancel buttons work
- [ ] Order cards display correctly

### Admin Flow
- [ ] Menu management CRUD operations
- [ ] Add-ons management CRUD operations
- [ ] Sales report displays correctly
- [ ] Toggle enable/disable works

### UI/UX
- [ ] Dark/light mode toggle works
- [ ] Theme persists across app restarts
- [ ] All buttons are properly centered
- [ ] Icons display correctly
- [ ] Text is readable in both themes
- [ ] Animations are smooth
- [ ] Loading states display correctly
- [ ] Error states display correctly

### Error Handling
- [ ] Error boundary catches errors
- [ ] Network errors are handled gracefully
- [ ] Invalid inputs show error messages
- [ ] Empty states display correctly

## Code Quality

### Linting
```bash
npm run lint
npm run lint:fix
```

### Static Analysis
- Check for unused variables
- Check for dead code
- Verify all imports are used
- Check for console.log statements (should be warnings/errors only)

## Error Logging

The app includes error logging via `errorLogger` utility:

```javascript
import errorLogger from './src/utils/errorLogger';

// Log errors
errorLogger.logError(error, { context: 'additional info' });

// Log interactions
errorLogger.logUIEvent('button_press', { button: 'cart', screen: 'Menu' });

// Get logs
const errors = errorLogger.getErrorLogs();
const interactions = errorLogger.getInteractionLogs();
```

## Continuous Integration

For CI/CD pipelines, use:
```bash
npm run test:ci
```

This runs tests with:
- Coverage reporting
- CI-friendly output
- Optimized worker count

## Best Practices

1. **Write tests before fixing bugs** - Create a failing test first, then fix
2. **Test user interactions** - Focus on what users do, not implementation
3. **Keep tests isolated** - Each test should be independent
4. **Use descriptive test names** - Describe what is being tested
5. **Mock external dependencies** - Firebase, navigation, etc.
6. **Test edge cases** - Empty states, error states, boundary conditions
7. **Maintain test coverage** - Aim for 60%+ coverage
8. **Review test failures** - Fix or update tests promptly

## Troubleshooting

### Tests fail with "Cannot find module"
- Ensure all dependencies are installed: `npm install`
- Check `jest.config.js` transformIgnorePatterns

### Tests fail with navigation errors
- Verify mocks in `jest.setup.js` are correct
- Check that navigation is properly mocked

### Coverage not generating
- Run `npm run test:coverage`
- Check `jest.config.js` coverage settings

## Future Improvements

- [ ] Add Detox for E2E testing
- [ ] Add visual regression tests
- [ ] Add performance tests
- [ ] Add accessibility tests
- [ ] Integrate with CI/CD pipeline
- [ ] Add test coverage badges to README

