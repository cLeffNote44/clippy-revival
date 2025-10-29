/**
 * SkipNavigation Component
 *
 * Provides skip links for keyboard users to bypass repetitive navigation
 * and jump directly to main content or other page sections.
 *
 * @module components/SkipNavigation
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Box, Link } from '@mui/material';

/**
 * SkipNavigation component
 *
 * Renders skip links that are hidden until focused, allowing keyboard users
 * to quickly navigate to important page sections.
 *
 * @component
 * @example
 * <SkipNavigation links={[
 *   { href: '#main-content', text: 'Skip to main content' },
 *   { href: '#navigation', text: 'Skip to navigation' },
 * ]} />
 */
const SkipNavigation = ({ links = [], className = '' }) => {
  const handleSkipClick = (event, targetId) => {
    event.preventDefault();

    // Remove # from targetId if present
    const id = targetId.startsWith('#') ? targetId.substring(1) : targetId;
    const target = document.getElementById(id);

    if (target) {
      // Make element focusable temporarily
      const originalTabIndex = target.getAttribute('tabindex');
      target.setAttribute('tabindex', '-1');

      // Focus the element
      target.focus();

      // Scroll into view
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Restore original tabindex after blur
      const restoreTabIndex = () => {
        if (originalTabIndex !== null) {
          target.setAttribute('tabindex', originalTabIndex);
        } else {
          target.removeAttribute('tabindex');
        }
        target.removeEventListener('blur', restoreTabIndex);
      };

      target.addEventListener('blur', restoreTabIndex);
    }
  };

  if (links.length === 0) {
    return null;
  }

  return (
    <Box
      component="nav"
      aria-label="Skip navigation"
      className={className}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.href}
          onClick={(e) => handleSkipClick(e, link.href)}
          sx={{
            position: 'absolute',
            left: '-9999px',
            top: '8px',
            zIndex: 9999,
            padding: '8px 16px',
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: 2,
            '&:focus': {
              left: '8px',
              outline: '3px solid',
              outlineColor: 'secondary.main',
              outlineOffset: '2px',
            },
            '&:hover:focus': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          {link.text}
        </Link>
      ))}
    </Box>
  );
};

SkipNavigation.propTypes = {
  /**
   * Array of skip link objects
   * Each object should have:
   * - href: Target element ID (with or without #)
   * - text: Link text to display
   */
  links: PropTypes.arrayOf(
    PropTypes.shape({
      href: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    })
  ),

  /** Additional CSS class name */
  className: PropTypes.string,
};

/**
 * Default skip links configuration
 */
SkipNavigation.defaultLinks = [
  { href: '#main-content', text: 'Skip to main content' },
  { href: '#primary-navigation', text: 'Skip to navigation' },
];

export default SkipNavigation;
