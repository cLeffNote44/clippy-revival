/**
 * FocusTrap Component
 *
 * A component that traps keyboard focus within its children,
 * essential for accessible modals, dialogs, and popups.
 *
 * @module components/FocusTrap
 */

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { focusManager, Keys } from '../utils/accessibility';

/**
 * FocusTrap component
 *
 * Traps focus within the component when active. Useful for modals and dialogs
 * to ensure keyboard users can't tab out of the interactive area.
 *
 * @component
 * @example
 * <FocusTrap active={isModalOpen}>
 *   <div className="modal">
 *     <h2>Modal Title</h2>
 *     <button>Close</button>
 *   </div>
 * </FocusTrap>
 */
const FocusTrap = ({
  children,
  active = true,
  autoFocus = true,
  restoreFocus = true,
  focusFirstOnActivate = true,
  onDeactivate = null,
  className = '',
}) => {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);
  const initialFocusRef = useRef(null);

  useEffect(() => {
    if (!active) {
      // Restore focus when deactivated
      if (restoreFocus && previousFocusRef.current) {
        try {
          previousFocusRef.current.focus();
        } catch (error) {
          console.warn('Failed to restore focus:', error);
        }
        previousFocusRef.current = null;
      }

      if (onDeactivate) {
        onDeactivate();
      }

      return;
    }

    // Save currently focused element
    previousFocusRef.current = document.activeElement;

    // Focus first element or specific element
    if (containerRef.current) {
      if (focusFirstOnActivate || autoFocus) {
        const focusableElements = focusManager.getFocusableElements(containerRef.current);

        if (focusableElements.length > 0) {
          // Use initial focus ref if set, otherwise first focusable
          const elementToFocus = initialFocusRef.current || focusableElements[0];

          // Small delay to ensure DOM is ready
          setTimeout(() => {
            try {
              elementToFocus.focus();
            } catch (error) {
              console.warn('Failed to focus element:', error);
            }
          }, 10);
        }
      }
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (event) => {
      if (!active || !containerRef.current) return;

      if (event.key === Keys.TAB) {
        focusManager.trapFocus(containerRef.current, event);
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, autoFocus, focusFirstOnActivate, restoreFocus, onDeactivate]);

  /**
   * Set initial focus element
   */
  const setInitialFocus = (element) => {
    initialFocusRef.current = element;
  };

  // Clone children and pass setInitialFocus if needed
  const childrenWithProps = typeof children === 'function'
    ? children({ setInitialFocus })
    : children;

  return (
    <div
      ref={containerRef}
      className={className}
      data-focus-trap={active ? 'active' : 'inactive'}
    >
      {childrenWithProps}
    </div>
  );
};

FocusTrap.propTypes = {
  /** Child elements to trap focus within */
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func,
  ]).isRequired,

  /** Whether focus trap is active */
  active: PropTypes.bool,

  /** Whether to auto-focus first element on activation */
  autoFocus: PropTypes.bool,

  /** Whether to restore focus to previous element on deactivation */
  restoreFocus: PropTypes.bool,

  /** Whether to focus first element when activated */
  focusFirstOnActivate: PropTypes.bool,

  /** Callback when focus trap is deactivated */
  onDeactivate: PropTypes.func,

  /** Additional CSS class name */
  className: PropTypes.string,
};

export default FocusTrap;
