/**
 * Accessibility React Hooks
 *
 * Custom hooks for implementing accessibility features in React components.
 *
 * @module hooks/useAccessibility
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  focusManager,
  announceToScreenReader,
  Keys,
  handleRovingTabIndex,
  generateAriaId,
} from '../utils/accessibility';

/**
 * Hook for keyboard navigation in lists, menus, and tabs
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether keyboard navigation is enabled
 * @param {string} options.orientation - 'horizontal' or 'vertical'
 * @param {Function} options.onSelect - Callback when item is selected
 * @param {boolean} options.loop - Whether navigation loops
 * @param {boolean} options.autoFocus - Whether to auto-focus first item
 * @returns {Object} Navigation state and handlers
 */
export function useKeyboardNavigation(options = {}) {
  const {
    enabled = true,
    orientation = 'vertical',
    onSelect = null,
    loop = true,
    autoFocus = false,
  } = options;

  const [focusedIndex, setFocusedIndex] = useState(autoFocus ? 0 : -1);
  const itemsRef = useRef([]);

  /**
   * Register an item for navigation
   */
  const registerItem = useCallback((element, index) => {
    if (element) {
      itemsRef.current[index] = element;
    }
  }, []);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (event, itemCount) => {
      if (!enabled || itemCount === 0) return;

      const isVertical = orientation === 'vertical';
      const nextKey = isVertical ? Keys.ARROW_DOWN : Keys.ARROW_RIGHT;
      const prevKey = isVertical ? Keys.ARROW_UP : Keys.ARROW_LEFT;

      let newIndex = focusedIndex;

      switch (event.key) {
        case nextKey:
          event.preventDefault();
          newIndex = loop
            ? (focusedIndex + 1) % itemCount
            : Math.min(focusedIndex + 1, itemCount - 1);
          break;

        case prevKey:
          event.preventDefault();
          newIndex = loop
            ? focusedIndex === 0 ? itemCount - 1 : focusedIndex - 1
            : Math.max(focusedIndex - 1, 0);
          break;

        case Keys.HOME:
          event.preventDefault();
          newIndex = 0;
          break;

        case Keys.END:
          event.preventDefault();
          newIndex = itemCount - 1;
          break;

        case Keys.ENTER:
        case Keys.SPACE:
          event.preventDefault();
          if (onSelect && focusedIndex >= 0) {
            onSelect(focusedIndex);
          }
          return;

        default:
          return;
      }

      setFocusedIndex(newIndex);

      // Focus the element
      if (itemsRef.current[newIndex]) {
        itemsRef.current[newIndex].focus();
      }
    },
    [enabled, orientation, focusedIndex, loop, onSelect]
  );

  /**
   * Get props for container element
   */
  const getContainerProps = useCallback(
    (itemCount) => ({
      onKeyDown: (e) => handleKeyDown(e, itemCount),
      role: orientation === 'vertical' ? 'menu' : 'menubar',
      'aria-orientation': orientation,
    }),
    [handleKeyDown, orientation]
  );

  /**
   * Get props for individual items
   */
  const getItemProps = useCallback(
    (index) => ({
      ref: (el) => registerItem(el, index),
      tabIndex: focusedIndex === index ? 0 : -1,
      onFocus: () => setFocusedIndex(index),
    }),
    [registerItem, focusedIndex]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    getContainerProps,
    getItemProps,
    registerItem,
  };
}

/**
 * Hook for managing focus trap (for modals, dialogs)
 *
 * @param {boolean} isActive - Whether focus trap is active
 * @returns {Object} Ref and handlers
 */
export function useFocusTrap(isActive = false) {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    // Save currently focused element
    previousFocusRef.current = document.activeElement;

    // Focus first element in container
    if (containerRef.current) {
      const focusable = focusManager.getFocusableElements(containerRef.current);
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }

    // Handle tab key to trap focus
    const handleKeyDown = (event) => {
      if (event.key === Keys.TAB && containerRef.current) {
        focusManager.trapFocus(containerRef.current, event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: restore focus
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return {
    containerRef,
    restoreFocus: () => {
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    },
  };
}

/**
 * Hook for focus management utilities
 *
 * @returns {Object} Focus management functions
 */
export function useFocusManagement() {
  const saveFocus = useCallback(() => {
    focusManager.saveFocus();
  }, []);

  const restoreFocus = useCallback(() => {
    focusManager.restoreFocus();
  }, []);

  const focusFirst = useCallback((container) => {
    return focusManager.focusFirst(container);
  }, []);

  const focusLast = useCallback((container) => {
    return focusManager.focusLast(container);
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    focusLast,
  };
}

/**
 * Hook for screen reader announcements
 *
 * @returns {Function} Announce function
 */
export function useAnnouncer() {
  const announce = useCallback((message, priority = 'polite') => {
    announceToScreenReader(message, priority);
  }, []);

  return announce;
}

/**
 * Hook for generating stable ARIA IDs
 *
 * @param {string} prefix - ID prefix
 * @returns {string} Stable ID
 */
export function useAriaId(prefix = 'aria') {
  const idRef = useRef(null);

  if (!idRef.current) {
    idRef.current = generateAriaId(prefix);
  }

  return idRef.current;
}

/**
 * Hook for managing ARIA live region
 *
 * @param {string} initialMessage - Initial message
 * @param {Object} options - Configuration options
 * @returns {Object} Message state and setter
 */
export function useLiveRegion(initialMessage = '', options = {}) {
  const { politeness = 'polite', clearDelay = 5000 } = options;
  const [message, setMessage] = useState(initialMessage);
  const timeoutRef = useRef(null);

  const announce = useCallback(
    (newMessage) => {
      setMessage(newMessage);

      if (clearDelay > 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setMessage('');
        }, clearDelay);
      }
    },
    [clearDelay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    message,
    announce,
    politeness,
  };
}

/**
 * Hook for managing skip links
 *
 * @returns {Object} Skip link helpers
 */
export function useSkipLink() {
  const skipToContent = useCallback((contentId) => {
    const content = document.getElementById(contentId);
    if (content) {
      content.setAttribute('tabindex', '-1');
      content.focus();
      content.addEventListener(
        'blur',
        () => content.removeAttribute('tabindex'),
        { once: true }
      );
    }
  }, []);

  return {
    skipToContent,
  };
}

/**
 * Hook for roving tab index (for toolbars, grids)
 *
 * @param {number} itemCount - Number of items
 * @param {Object} options - Configuration options
 * @returns {Object} State and handlers
 */
export function useRovingTabIndex(itemCount, options = {}) {
  const { orientation = 'horizontal', defaultIndex = 0 } = options;
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  const handleKeyDown = useCallback(
    (event) => {
      if (itemCount === 0) return;

      const items = Array.from({ length: itemCount }, (_, i) => i);
      const newIndex = handleRovingTabIndex(event, items, activeIndex, orientation);

      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    },
    [itemCount, activeIndex, orientation]
  );

  const getItemProps = useCallback(
    (index) => ({
      tabIndex: index === activeIndex ? 0 : -1,
      onFocus: () => setActiveIndex(index),
    }),
    [activeIndex]
  );

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    getItemProps,
  };
}

/**
 * Hook for managing expanded/collapsed state with ARIA
 *
 * @param {boolean} initialExpanded - Initial expanded state
 * @returns {Object} State, toggle, and ARIA props
 */
export function useExpanded(initialExpanded = false) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const controlId = useAriaId('control');
  const contentId = useAriaId('content');

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const getToggleProps = useCallback(
    () => ({
      id: controlId,
      'aria-expanded': isExpanded,
      'aria-controls': contentId,
    }),
    [controlId, contentId, isExpanded]
  );

  const getContentProps = useCallback(
    () => ({
      id: contentId,
      'aria-labelledby': controlId,
      hidden: !isExpanded,
    }),
    [controlId, contentId, isExpanded]
  );

  return {
    isExpanded,
    setIsExpanded,
    toggle,
    getToggleProps,
    getContentProps,
    controlId,
    contentId,
  };
}

/**
 * Hook for managing dialog/modal accessibility
 *
 * @param {boolean} isOpen - Whether dialog is open
 * @returns {Object} Dialog props and handlers
 */
export function useDialog(isOpen = false) {
  const dialogRef = useRef(null);
  const titleId = useAriaId('dialog-title');
  const descId = useAriaId('dialog-desc');
  const { containerRef, restoreFocus } = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Handle escape key
    const handleEscape = (event) => {
      if (event.key === Keys.ESCAPE) {
        restoreFocus();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, restoreFocus]);

  const getDialogProps = useCallback(
    () => ({
      ref: containerRef,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': titleId,
      'aria-describedby': descId,
    }),
    [containerRef, titleId, descId]
  );

  const getTitleProps = useCallback(
    () => ({
      id: titleId,
    }),
    [titleId]
  );

  const getDescriptionProps = useCallback(
    () => ({
      id: descId,
    }),
    [descId]
  );

  return {
    dialogRef: containerRef,
    getDialogProps,
    getTitleProps,
    getDescriptionProps,
    titleId,
    descId,
    restoreFocus,
  };
}

/**
 * Hook for managing checkbox/switch accessibility
 *
 * @param {boolean} initialChecked - Initial checked state
 * @param {Function} onChange - Change handler
 * @returns {Object} State and props
 */
export function useCheckbox(initialChecked = false, onChange = null) {
  const [isChecked, setIsChecked] = useState(initialChecked);
  const checkboxId = useAriaId('checkbox');

  const toggle = useCallback(() => {
    setIsChecked((prev) => {
      const newValue = !prev;
      if (onChange) {
        onChange(newValue);
      }
      return newValue;
    });
  }, [onChange]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === Keys.SPACE) {
        event.preventDefault();
        toggle();
      }
    },
    [toggle]
  );

  const getCheckboxProps = useCallback(
    () => ({
      id: checkboxId,
      role: 'checkbox',
      'aria-checked': isChecked,
      tabIndex: 0,
      onKeyDown: handleKeyDown,
      onClick: toggle,
    }),
    [checkboxId, isChecked, handleKeyDown, toggle]
  );

  return {
    isChecked,
    setIsChecked,
    toggle,
    getCheckboxProps,
    checkboxId,
  };
}

/**
 * Hook for managing tab accessibility
 *
 * @param {number} tabCount - Number of tabs
 * @param {Object} options - Configuration options
 * @returns {Object} Tab state and props
 */
export function useTabs(tabCount, options = {}) {
  const { defaultTab = 0, onChange = null } = options;
  const [selectedTab, setSelectedTab] = useState(defaultTab);
  const tablistId = useAriaId('tablist');

  const selectTab = useCallback(
    (index) => {
      if (index >= 0 && index < tabCount) {
        setSelectedTab(index);
        if (onChange) {
          onChange(index);
        }
      }
    },
    [tabCount, onChange]
  );

  const handleKeyDown = useCallback(
    (event) => {
      let newIndex = selectedTab;

      switch (event.key) {
        case Keys.ARROW_LEFT:
          event.preventDefault();
          newIndex = selectedTab === 0 ? tabCount - 1 : selectedTab - 1;
          break;
        case Keys.ARROW_RIGHT:
          event.preventDefault();
          newIndex = (selectedTab + 1) % tabCount;
          break;
        case Keys.HOME:
          event.preventDefault();
          newIndex = 0;
          break;
        case Keys.END:
          event.preventDefault();
          newIndex = tabCount - 1;
          break;
        default:
          return;
      }

      selectTab(newIndex);
    },
    [selectedTab, tabCount, selectTab]
  );

  const getTablistProps = useCallback(
    () => ({
      id: tablistId,
      role: 'tablist',
      'aria-orientation': 'horizontal',
    }),
    [tablistId]
  );

  const getTabProps = useCallback(
    (index) => {
      const isSelected = index === selectedTab;
      return {
        role: 'tab',
        'aria-selected': isSelected,
        'aria-controls': `${tablistId}-panel-${index}`,
        tabIndex: isSelected ? 0 : -1,
        onKeyDown: handleKeyDown,
        onClick: () => selectTab(index),
      };
    },
    [selectedTab, tablistId, handleKeyDown, selectTab]
  );

  const getTabPanelProps = useCallback(
    (index) => ({
      id: `${tablistId}-panel-${index}`,
      role: 'tabpanel',
      'aria-labelledby': `${tablistId}-tab-${index}`,
      tabIndex: 0,
      hidden: index !== selectedTab,
    }),
    [tablistId, selectedTab]
  );

  return {
    selectedTab,
    selectTab,
    getTablistProps,
    getTabProps,
    getTabPanelProps,
  };
}

export default {
  useKeyboardNavigation,
  useFocusTrap,
  useFocusManagement,
  useAnnouncer,
  useAriaId,
  useLiveRegion,
  useSkipLink,
  useRovingTabIndex,
  useExpanded,
  useDialog,
  useCheckbox,
  useTabs,
};
