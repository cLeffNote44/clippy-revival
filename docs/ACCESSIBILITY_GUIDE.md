# Accessibility Guide

This guide provides comprehensive information about accessibility features implemented in Clippy Revival and best practices for maintaining WCAG 2.1 AA compliance.

## Table of Contents

1. [Overview](#overview)
2. [Accessibility Standards](#accessibility-standards)
3. [Utilities and Helpers](#utilities-and-helpers)
4. [React Hooks](#react-hooks)
5. [Components](#components)
6. [ARIA Patterns](#aria-patterns)
7. [Keyboard Navigation](#keyboard-navigation)
8. [Screen Reader Support](#screen-reader-support)
9. [Color Contrast](#color-contrast)
10. [Focus Management](#focus-management)
11. [Testing Accessibility](#testing-accessibility)
12. [Best Practices](#best-practices)
13. [Common Patterns](#common-patterns)
14. [Troubleshooting](#troubleshooting)

---

## Overview

Clippy Revival is committed to providing an accessible experience for all users, including those using assistive technologies such as screen readers, keyboard-only navigation, or voice control.

### Accessibility Goals

- **WCAG 2.1 AA Compliance**: Meet Level AA success criteria
- **Keyboard Navigation**: Full keyboard accessibility without requiring a mouse
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: 4.5:1 minimum contrast ratio for normal text
- **Focus Management**: Clear focus indicators and logical focus order
- **Responsive Design**: Accessible at all screen sizes and zoom levels

### Key Features

✅ Comprehensive ARIA utilities and helpers
✅ Custom React hooks for accessibility patterns
✅ Focus trap for modals and dialogs
✅ Live regions for screen reader announcements
✅ Skip navigation links
✅ Color contrast validation
✅ Keyboard navigation helpers
✅ Roving tab index support

---

## Accessibility Standards

### WCAG 2.1 Guidelines

We follow the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA:

**Perceivable**
- Provide text alternatives for non-text content
- Provide captions and alternatives for multimedia
- Make content adaptable and distinguishable

**Operable**
- Make all functionality keyboard accessible
- Provide enough time for users to read and use content
- Don't use content that causes seizures
- Help users navigate and find content

**Understandable**
- Make text readable and understandable
- Make content appear and operate predictably
- Help users avoid and correct mistakes

**Robust**
- Maximize compatibility with assistive technologies

### Compliance Checklist

- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Color contrast meets 4.5:1 ratio
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] ARIA labels are present and accurate
- [ ] Heading hierarchy is logical (h1, h2, h3...)
- [ ] Page has a main landmark
- [ ] Skip navigation links are provided
- [ ] Form errors are announced to screen readers

---

## Utilities and Helpers

### Accessibility Utilities (`src/utils/accessibility.js`)

The accessibility utilities module provides comprehensive helpers for implementing accessible features.

#### ARIA Helpers

```javascript
import { aria } from '../utils/accessibility';

// Basic ARIA attributes
<button {...aria.label('Close dialog')}>×</button>
<button {...aria.expanded(isOpen)} {...aria.controls('menu-1')}>Menu</button>
<div {...aria.hidden(true)}>Decorative content</div>

// Form field attributes
<input
  {...aria.required(true)}
  {...aria.invalid(hasError)}
  {...aria.describedBy('error-message')}
/>

// Live regions
<div {...aria.live('polite', true)}>Status updates</div>
<div {...aria.live('assertive', false)}>Important alerts</div>

// Dialog/Modal
<div {...aria.dialog('dialog-title', 'dialog-desc')}>
  <h2 id="dialog-title">Dialog Title</h2>
  <p id="dialog-desc">Dialog description</p>
</div>

// Tabs
<div role="tablist">
  <button {...aria.tab(isSelected, 'panel-1')}>Tab 1</button>
</div>
<div {...aria.tabpanel('tab-1', !isSelected)}>Panel content</div>

// Menu
<div {...aria.menu('vertical')}>
  <button {...aria.menuitem(false)}>Menu Item</button>
</div>
```

#### Focus Manager

```javascript
import { focusManager } from '../utils/accessibility';

// Get focusable elements
const focusableElements = focusManager.getFocusableElements(containerElement);

// Focus first/last element
focusManager.focusFirst(containerElement);
focusManager.focusLast(containerElement);

// Save and restore focus
focusManager.saveFocus();
// ... do something ...
focusManager.restoreFocus();

// Trap focus (for modals)
const handleKeyDown = (event) => {
  focusManager.trapFocus(containerElement, event);
};
```

#### Screen Reader Utilities

```javascript
import { announceToScreenReader, getScreenReaderOnlyStyles } from '../utils/accessibility';

// Announce to screen readers
announceToScreenReader('Item added to cart', 'polite');
announceToScreenReader('Error occurred!', 'assertive');

// Screen reader only styles
<span style={getScreenReaderOnlyStyles()}>
  Visually hidden but announced by screen readers
</span>
```

#### Keyboard Navigation Helpers

```javascript
import { Keys, isActivationKey, isArrowKey } from '../utils/accessibility';

const handleKeyDown = (event) => {
  if (isActivationKey(event)) {
    // Enter or Space pressed
    handleActivate();
  }

  if (isArrowKey(event)) {
    // Arrow key pressed
    handleNavigation(event);
  }

  switch (event.key) {
    case Keys.ESCAPE:
      handleClose();
      break;
    case Keys.TAB:
      handleTab(event);
      break;
  }
};
```

#### Color Contrast Utilities

```javascript
import { validateContrast, getContrastRatio } from '../utils/accessibility';

// Validate contrast
const result = validateContrast('#000000', '#FFFFFF', {
  level: 'AA',
  largeText: false
});

console.log(result);
// {
//   ratio: 21,
//   passes: true,
//   level: 'AA',
//   largeText: false,
//   foreground: '#000000',
//   background: '#FFFFFF'
// }

// Get contrast ratio
const ratio = getContrastRatio('#333333', '#FFFFFF');
console.log(ratio); // 12.63
```

---

## React Hooks

### Accessibility Hooks (`src/hooks/useAccessibility.js`)

Custom React hooks for implementing accessibility patterns.

#### useKeyboardNavigation

Navigate through items with arrow keys.

```javascript
import { useKeyboardNavigation } from '../hooks/useAccessibility';

function Menu({ items }) {
  const { getContainerProps, getItemProps, focusedIndex } = useKeyboardNavigation({
    orientation: 'vertical',
    loop: true,
    onSelect: (index) => handleItemSelect(items[index]),
  });

  return (
    <div {...getContainerProps(items.length)}>
      {items.map((item, index) => (
        <button
          key={index}
          {...getItemProps(index)}
          className={focusedIndex === index ? 'focused' : ''}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

#### useFocusTrap

Trap focus within a modal or dialog.

```javascript
import { useFocusTrap } from '../hooks/useAccessibility';

function Modal({ isOpen, onClose }) {
  const { containerRef } = useFocusTrap(isOpen);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div ref={containerRef} className="modal">
        <h2>Modal Title</h2>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

#### useAnnouncer

Announce messages to screen readers.

```javascript
import { useAnnouncer } from '../hooks/useAccessibility';

function ShoppingCart() {
  const announce = useAnnouncer();

  const handleAddToCart = (item) => {
    addItem(item);
    announce(`${item.name} added to cart`, 'polite');
  };

  return <button onClick={() => handleAddToCart(item)}>Add to Cart</button>;
}
```

#### useAriaId

Generate stable ARIA IDs for relationships.

```javascript
import { useAriaId } from '../hooks/useAccessibility';

function FormField({ label, error }) {
  const inputId = useAriaId('input');
  const errorId = useAriaId('error');

  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
      />
      {error && <span id={errorId} role="alert">{error}</span>}
    </div>
  );
}
```

#### useLiveRegion

Manage ARIA live regions for announcements.

```javascript
import { useLiveRegion } from '../hooks/useAccessibility';

function SearchResults() {
  const { message, announce, politeness } = useLiveRegion('', {
    politeness: 'polite',
    clearDelay: 5000,
  });

  const handleSearch = (query) => {
    const results = performSearch(query);
    announce(`Found ${results.length} results for ${query}`);
  };

  return (
    <>
      <div aria-live={politeness} aria-atomic="true">
        {message}
      </div>
      <SearchInput onSearch={handleSearch} />
    </>
  );
}
```

#### useExpanded

Manage expanded/collapsed state with ARIA.

```javascript
import { useExpanded } from '../hooks/useAccessibility';

function Accordion({ title, content }) {
  const { isExpanded, toggle, getToggleProps, getContentProps } = useExpanded(false);

  return (
    <div>
      <button {...getToggleProps()} onClick={toggle}>
        {title}
        <span>{isExpanded ? '▲' : '▼'}</span>
      </button>
      <div {...getContentProps()}>
        {content}
      </div>
    </div>
  );
}
```

#### useDialog

Manage dialog/modal accessibility.

```javascript
import { useDialog } from '../hooks/useAccessibility';

function Dialog({ isOpen, onClose, title, description }) {
  const { getDialogProps, getTitleProps, getDescriptionProps } = useDialog(isOpen);

  if (!isOpen) return null;

  return (
    <div className="overlay">
      <div {...getDialogProps()}>
        <h2 {...getTitleProps()}>{title}</h2>
        <p {...getDescriptionProps()}>{description}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

#### useTabs

Manage tab accessibility with keyboard navigation.

```javascript
import { useTabs } from '../hooks/useAccessibility';

function TabPanel({ tabs }) {
  const { selectedTab, getTablistProps, getTabProps, getTabPanelProps } = useTabs(
    tabs.length,
    { defaultTab: 0 }
  );

  return (
    <div>
      <div {...getTablistProps()}>
        {tabs.map((tab, index) => (
          <button key={index} {...getTabProps(index)}>
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div key={index} {...getTabPanelProps(index)}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

---

## Components

### FocusTrap

Trap keyboard focus within a container (essential for modals).

```javascript
import FocusTrap from '../components/FocusTrap';

function Modal({ isOpen, onClose }) {
  return (
    <FocusTrap active={isOpen} restoreFocus={true}>
      <div className="modal">
        <h2>Modal Title</h2>
        <button onClick={onClose}>Close</button>
      </div>
    </FocusTrap>
  );
}
```

**Props:**
- `active` (boolean): Whether focus trap is active
- `autoFocus` (boolean): Auto-focus first element
- `restoreFocus` (boolean): Restore focus on deactivate
- `focusFirstOnActivate` (boolean): Focus first element when activated
- `onDeactivate` (function): Callback when deactivated

### LiveRegion

Announce dynamic content changes to screen readers.

```javascript
import LiveRegion from '../components/LiveRegion';

function Notifications() {
  const [notification, setNotification] = useState('');

  return (
    <>
      <LiveRegion message={notification} politeness="polite" clearAfter={5000} />
      <button onClick={() => setNotification('Action completed')}>
        Do Action
      </button>
    </>
  );
}
```

**Variants:**
```javascript
// Alert (assertive)
<LiveRegion.Alert message="Error occurred!" clearAfter={5000} />

// Status (polite)
<LiveRegion.Status message="Changes saved" clearAfter={5000} />

// Log (persistent)
<LiveRegion.Log message="User logged in at 10:30 AM" />
```

**Props:**
- `message` (string): Message to announce
- `politeness` ('polite'|'assertive'|'off'): Announcement priority
- `atomic` (boolean): Announce entire region or just changes
- `clearAfter` (number): Auto-clear after milliseconds (0 = no clear)
- `role` ('status'|'alert'|'log'): ARIA role

### SkipNavigation

Provide skip links for keyboard users.

```javascript
import SkipNavigation from '../components/SkipNavigation';

function App() {
  return (
    <>
      <SkipNavigation
        links={[
          { href: '#main-content', text: 'Skip to main content' },
          { href: '#navigation', text: 'Skip to navigation' },
          { href: '#search', text: 'Skip to search' },
        ]}
      />
      <nav id="navigation">...</nav>
      <main id="main-content">...</main>
    </>
  );
}
```

**Props:**
- `links` (array): Array of {href, text} objects
- `className` (string): Additional CSS class

---

## ARIA Patterns

### Common ARIA Attributes

#### Labels and Descriptions

```javascript
// aria-label: Direct label
<button aria-label="Close">×</button>

// aria-labelledby: Reference to label element
<div>
  <h2 id="section-title">User Settings</h2>
  <section aria-labelledby="section-title">...</section>
</div>

// aria-describedby: Reference to description
<input
  aria-describedby="password-help"
  type="password"
/>
<span id="password-help">Must be at least 8 characters</span>
```

#### States and Properties

```javascript
// Expanded/collapsed
<button aria-expanded={isOpen} aria-controls="menu-1">
  Menu
</button>
<div id="menu-1" hidden={!isOpen}>Menu items</div>

// Selected
<button aria-selected={isSelected} role="tab">Tab 1</button>

// Checked
<div role="checkbox" aria-checked={isChecked} tabIndex={0}>
  <span>{isChecked ? '☑' : '☐'}</span> Option
</div>

// Disabled
<button aria-disabled={isDisabled}>Submit</button>

// Required
<input aria-required="true" />

// Invalid
<input aria-invalid={hasError} aria-describedby="error-msg" />
<span id="error-msg" role="alert">{error}</span>
```

#### Live Regions

```javascript
// Polite announcements (wait for pause)
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Assertive announcements (interrupt)
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>

// Status updates
<div role="status" aria-live="polite">
  Saving... Done!
</div>
```

---

## Keyboard Navigation

### Navigation Principles

1. **Tab Order**: Logical and predictable tab order
2. **Focus Indicators**: Clear visual focus indicators
3. **Keyboard Shortcuts**: Consistent with platform conventions
4. **Focus Management**: Move focus appropriately after actions

### Common Keyboard Patterns

#### Buttons and Links

```javascript
// Activation: Enter or Space
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Click Me
</button>
```

#### Lists and Menus

```javascript
// Arrow keys for navigation, Enter/Space for activation
<div
  role="menu"
  aria-orientation="vertical"
  onKeyDown={(e) => {
    switch (e.key) {
      case 'ArrowDown':
        focusNextItem();
        break;
      case 'ArrowUp':
        focusPreviousItem();
        break;
      case 'Home':
        focusFirstItem();
        break;
      case 'End':
        focusLastItem();
        break;
      case 'Enter':
      case ' ':
        activateItem();
        break;
    }
  }}
>
  {menuItems}
</div>
```

#### Tabs

```javascript
// Left/Right arrows for horizontal tabs
<div role="tablist" aria-orientation="horizontal">
  {tabs.map((tab, index) => (
    <button
      key={index}
      role="tab"
      aria-selected={selectedTab === index}
      tabIndex={selectedTab === index ? 0 : -1}
      onKeyDown={(e) => {
        switch (e.key) {
          case 'ArrowLeft':
            selectPreviousTab();
            break;
          case 'ArrowRight':
            selectNextTab();
            break;
          case 'Home':
            selectFirstTab();
            break;
          case 'End':
            selectLastTab();
            break;
        }
      }}
    >
      {tab.label}
    </button>
  ))}
</div>
```

#### Modals and Dialogs

```javascript
// Escape to close, Tab to cycle focus
<FocusTrap active={isOpen}>
  <div
    role="dialog"
    aria-modal="true"
    onKeyDown={(e) => {
      if (e.key === 'Escape') {
        closeDialog();
      }
    }}
  >
    {dialogContent}
  </div>
</FocusTrap>
```

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Navigate forward | Tab |
| Navigate backward | Shift + Tab |
| Activate/Select | Enter or Space |
| Close/Cancel | Escape |
| Next item | Arrow Down/Right |
| Previous item | Arrow Up/Left |
| First item | Home |
| Last item | End |

---

## Screen Reader Support

### Best Practices

1. **Use Semantic HTML**: `<nav>`, `<main>`, `<article>`, `<button>`, etc.
2. **Provide Text Alternatives**: Alt text for images, labels for inputs
3. **Use ARIA When Needed**: Enhance semantics, not replace them
4. **Announce Dynamic Changes**: Use live regions for updates
5. **Logical Document Structure**: Proper heading hierarchy

### Semantic HTML Examples

```html
<!-- Good: Semantic structure -->
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>
<main>
  <article>
    <h1>Article Title</h1>
    <p>Content...</p>
  </article>
</main>
<footer>
  <p>&copy; 2025 Clippy Revival</p>
</footer>

<!-- Bad: Non-semantic structure -->
<div class="header">
  <div class="nav">
    <div class="link">Home</div>
  </div>
</div>
```

### Screen Reader Testing

Test with popular screen readers:

- **NVDA** (Windows, free): https://www.nvaccess.org/
- **JAWS** (Windows, paid): https://www.freedomscientific.com/
- **VoiceOver** (macOS/iOS, built-in): Cmd+F5
- **TalkBack** (Android, built-in): Settings → Accessibility

### Common Announcements

```javascript
// Page load
announce('Dashboard loaded', 'polite');

// Form submission
announce('Form submitted successfully', 'polite');

// Errors
announce('Error: Invalid email address', 'assertive');

// Loading states
announce('Loading...', 'polite');
announce('Content loaded', 'polite');

// Item counts
announce(`Showing ${count} of ${total} results`, 'polite');
```

---

## Color Contrast

### WCAG Standards

- **Normal Text**: 4.5:1 minimum contrast ratio (AA), 7:1 enhanced (AAA)
- **Large Text**: 3:1 minimum (AA), 4.5:1 enhanced (AAA)
  - Large text = 18pt+ or 14pt+ bold

### Checking Contrast

```javascript
import { validateContrast } from '../utils/accessibility';

// Check text color contrast
const result = validateContrast('#666666', '#FFFFFF', {
  level: 'AA',
  largeText: false
});

if (!result.passes) {
  console.warn(`Contrast ratio ${result.ratio} does not meet ${result.level} standards`);
}
```

### Accessible Color Palette

```javascript
// Example accessible colors (WCAG AA compliant on white background)
const colors = {
  // Text on white
  textPrimary: '#212121',     // 16.1:1 ratio
  textSecondary: '#666666',   // 5.7:1 ratio

  // Interactive elements
  primary: '#1976D2',         // 4.5:1 ratio
  error: '#D32F2F',           // 5.5:1 ratio
  success: '#388E3C',         // 4.5:1 ratio
  warning: '#F57C00',         // 3.8:1 ratio (use for large text only)
};
```

### Tools for Checking Contrast

- **Built-in Utility**: `validateContrast()` in accessibility.js
- **Online Tools**:
  - WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
  - Coolors Contrast Checker: https://coolors.co/contrast-checker
- **Browser Extensions**:
  - axe DevTools
  - WAVE Evaluation Tool

---

## Focus Management

### Focus Indicators

All interactive elements must have visible focus indicators.

```css
/* Good: Clear focus indicator */
button:focus,
a:focus {
  outline: 3px solid #1976D2;
  outline-offset: 2px;
}

/* Bad: No focus indicator */
button:focus {
  outline: none; /* ❌ Never do this without alternative */
}

/* Acceptable: Custom focus indicator */
button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.5);
}
```

### Focus Order

Ensure logical tab order matching visual layout.

```javascript
// Good: Natural DOM order
<form>
  <input name="firstName" />  {/* tabIndex 0 (auto) */}
  <input name="lastName" />   {/* tabIndex 0 (auto) */}
  <button>Submit</button>     {/* tabIndex 0 (auto) */}
</form>

// Bad: Forced tab order
<form>
  <input name="lastName" tabIndex={1} />
  <input name="firstName" tabIndex={2} />  {/* ❌ Confusing order */}
  <button tabIndex={3}>Submit</button>
</form>
```

### Managing Focus After Actions

```javascript
// After closing modal
const closeModal = () => {
  setIsOpen(false);
  // Restore focus to trigger button
  triggerButtonRef.current?.focus();
};

// After deleting item
const deleteItem = (id) => {
  removeItem(id);
  // Focus next item or previous if last
  const nextItem = getNextItem(id) || getPreviousItem(id);
  nextItem?.focus();
};

// After page navigation
useEffect(() => {
  // Focus main content on route change
  document.getElementById('main-content')?.focus();
}, [location]);
```

---

## Testing Accessibility

### Automated Testing

#### axe-core with Jest

```javascript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Component has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### Testing Library Accessibility Queries

```javascript
import { render, screen } from '@testing-library/react';

test('Button has accessible name', () => {
  render(<button aria-label="Close">×</button>);
  expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
});

test('Form field has label', () => {
  render(
    <div>
      <label htmlFor="email">Email</label>
      <input id="email" />
    </div>
  );
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
});
```

### Manual Testing

#### Keyboard Testing

1. Tab through all interactive elements
2. Ensure visible focus indicators
3. Activate elements with Enter/Space
4. Navigate lists/menus with arrow keys
5. Close modals with Escape

#### Screen Reader Testing

1. Navigate by headings (H key in NVDA)
2. Navigate by landmarks (D key in NVDA)
3. Navigate by form fields (F key in NVDA)
4. Listen to all announced content
5. Verify table structure (T key in NVDA)

#### Color Contrast Testing

1. Use contrast checker tools
2. Test in high contrast mode
3. Verify in grayscale
4. Check against color blindness simulations

### Accessibility Audit Checklist

```markdown
## Page Structure
- [ ] Page has `<title>` element
- [ ] Page has exactly one `<h1>`
- [ ] Headings are in logical order (no skipped levels)
- [ ] Page has `<main>` landmark
- [ ] Navigation is in `<nav>` landmark
- [ ] Page language is set (`<html lang="en">`)

## Images and Media
- [ ] All images have alt text
- [ ] Decorative images have empty alt (`alt=""`)
- [ ] Complex images have extended descriptions
- [ ] Icons have accessible names
- [ ] Videos have captions

## Forms
- [ ] All inputs have labels
- [ ] Required fields are marked (aria-required)
- [ ] Errors are associated with fields (aria-describedby)
- [ ] Errors are announced to screen readers
- [ ] Field groups use `<fieldset>` and `<legend>`

## Interactive Elements
- [ ] All interactive elements are keyboard accessible
- [ ] Custom controls have appropriate ARIA roles
- [ ] Focus indicators are visible
- [ ] Tab order is logical
- [ ] No keyboard traps

## Dynamic Content
- [ ] Loading states are announced
- [ ] Errors are announced
- [ ] Success messages are announced
- [ ] Updated content uses live regions
- [ ] Infinite scroll is accessible

## Color and Contrast
- [ ] Text has 4.5:1 contrast ratio
- [ ] Large text has 3:1 contrast ratio
- [ ] Information not conveyed by color alone
- [ ] Focus indicators have 3:1 contrast

## Modals and Dialogs
- [ ] Focus is trapped within modal
- [ ] Focus returns on close
- [ ] Escape key closes modal
- [ ] Modal has aria-modal="true"
- [ ] Modal has aria-labelledby and aria-describedby
```

---

## Best Practices

### 1. Use Semantic HTML First

```javascript
// ✅ Good: Semantic HTML
<button onClick={handleClick}>Click Me</button>

// ❌ Bad: Div button
<div onClick={handleClick}>Click Me</div>

// ⚠️ Acceptable with ARIA
<div role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
  Click Me
</div>
```

### 2. Provide Meaningful Labels

```javascript
// ✅ Good: Descriptive label
<button aria-label="Close settings dialog">×</button>

// ❌ Bad: No label
<button>×</button>

// ✅ Good: Form label
<label htmlFor="email">Email Address</label>
<input id="email" type="email" />

// ❌ Bad: Placeholder as label
<input placeholder="Email Address" />
```

### 3. Manage Focus Appropriately

```javascript
// ✅ Good: Focus management
const openModal = () => {
  setIsOpen(true);
  // Focus will be trapped by FocusTrap component
};

const closeModal = () => {
  setIsOpen(false);
  // FocusTrap restores focus automatically
};

// ❌ Bad: No focus management
const openModal = () => setIsOpen(true);
const closeModal = () => setIsOpen(false);
```

### 4. Announce Dynamic Changes

```javascript
// ✅ Good: Announce updates
const deleteItem = (id) => {
  removeItem(id);
  announce('Item deleted', 'polite');
};

// ❌ Bad: Silent update
const deleteItem = (id) => {
  removeItem(id);
};
```

### 5. Test with Real Users

- Test with keyboard only
- Test with screen readers
- Test with magnification
- Test with voice control
- Get feedback from users with disabilities

---

## Common Patterns

### Accessible Modal

```javascript
import FocusTrap from '../components/FocusTrap';
import { useDialog } from '../hooks/useAccessibility';

function Modal({ isOpen, onClose, title, children }) {
  const { getDialogProps, getTitleProps } = useDialog(isOpen);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <FocusTrap active={isOpen}>
        <div
          {...getDialogProps()}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        >
          <h2 {...getTitleProps()}>{title}</h2>
          {children}
          <button onClick={onClose}>Close</button>
        </div>
      </FocusTrap>
    </div>
  );
}
```

### Accessible Dropdown

```javascript
import { useExpanded } from '../hooks/useAccessibility';

function Dropdown({ label, options }) {
  const { isExpanded, toggle, getToggleProps, getContentProps } = useExpanded();

  return (
    <div>
      <button {...getToggleProps()} onClick={toggle}>
        {label}
      </button>
      <ul {...getContentProps()}>
        {options.map((option, index) => (
          <li key={index} role="option">
            {option}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Accessible Form

```javascript
import { useAriaId } from '../hooks/useAccessibility';
import LiveRegion from '../components/LiveRegion';

function ContactForm() {
  const [errors, setErrors] = useState({});
  const [announcement, setAnnouncement] = useState('');
  const emailId = useAriaId('email');
  const emailErrorId = useAriaId('email-error');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      submit();
      setAnnouncement('Form submitted successfully');
    } else {
      setAnnouncement('Form has errors. Please correct and try again');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <LiveRegion.Alert message={announcement} />

      <div>
        <label htmlFor={emailId}>Email Address *</label>
        <input
          id={emailId}
          type="email"
          required
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? emailErrorId : undefined}
        />
        {errors.email && (
          <span id={emailErrorId} role="alert">
            {errors.email}
          </span>
        )}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Troubleshooting

### Issue: Focus Not Visible

**Symptom**: Can't see where keyboard focus is

**Solution**:
```css
/* Ensure visible focus indicators */
*:focus {
  outline: 3px solid #1976D2;
  outline-offset: 2px;
}

/* Or custom focus styles */
button:focus {
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.5);
}
```

### Issue: Screen Reader Not Announcing Changes

**Symptom**: Dynamic content updates silently

**Solution**:
```javascript
// Use LiveRegion component
<LiveRegion message={statusMessage} politeness="polite" />

// Or announceToScreenReader utility
import { announceToScreenReader } from '../utils/accessibility';
announceToScreenReader('Content updated', 'polite');
```

### Issue: Keyboard Trap in Modal

**Symptom**: Can't tab out of modal

**Solution**:
```javascript
// Use FocusTrap component
<FocusTrap active={isOpen} restoreFocus={true}>
  <div className="modal">
    {modalContent}
  </div>
</FocusTrap>
```

### Issue: Poor Color Contrast

**Symptom**: Text hard to read

**Solution**:
```javascript
// Use contrast validator
import { validateContrast } from '../utils/accessibility';

const result = validateContrast(textColor, backgroundColor);
if (!result.passes) {
  console.error(`Contrast ${result.ratio} fails ${result.level} standard`);
}
```

### Issue: Missing Accessible Names

**Symptom**: Screen reader announces "button" with no context

**Solution**:
```javascript
// Add aria-label
<button aria-label="Close dialog">×</button>

// Or use text content
<button>
  <CloseIcon aria-hidden="true" />
  <span>Close</span>
</button>

// Or use aria-labelledby
<div>
  <h2 id="dialog-title">Confirm Delete</h2>
  <button aria-labelledby="dialog-title">Confirm</button>
</div>
```

---

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [pa11y](https://pa11y.org/)

### Screen Readers
- [NVDA](https://www.nvaccess.org/) (Windows, Free)
- [JAWS](https://www.freedomscientific.com/) (Windows)
- VoiceOver (macOS/iOS, Built-in)
- TalkBack (Android, Built-in)

### Testing
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

---

## Conclusion

Accessibility is not a feature—it's a fundamental requirement. By following these guidelines and using the provided utilities, hooks, and components, you can ensure Clippy Revival is accessible to all users.

For questions or accessibility issues, please refer to this guide or consult the WCAG 2.1 documentation.

**Remember**: When in doubt, test with real assistive technologies and real users.
