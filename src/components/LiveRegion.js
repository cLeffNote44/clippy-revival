/**
 * LiveRegion Component
 *
 * A component for announcing dynamic content changes to screen readers
 * using ARIA live regions.
 *
 * @module components/LiveRegion
 */

import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { getScreenReaderOnlyStyles } from '../utils/accessibility';

/**
 * LiveRegion component
 *
 * Announces messages to screen readers using ARIA live regions.
 * Content is visually hidden but accessible to assistive technologies.
 *
 * @component
 * @example
 * <LiveRegion message="Item added to cart" politeness="polite" />
 *
 * @example
 * // With auto-clear
 * <LiveRegion
 *   message="Error occurred"
 *   politeness="assertive"
 *   clearAfter={5000}
 * />
 */
const LiveRegion = ({
  message = '',
  politeness = 'polite',
  atomic = true,
  relevant = 'additions text',
  clearAfter = 0,
  role = 'status',
  className = '',
}) => {
  const [currentMessage, setCurrentMessage] = useState(message);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);

      // Clear message after delay if specified
      if (clearAfter > 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setCurrentMessage('');
        }, clearAfter);
      }
    } else {
      setCurrentMessage('');
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter]);

  return (
    <Box
      component="div"
      role={role}
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={className}
      sx={getScreenReaderOnlyStyles()}
    >
      {currentMessage}
    </Box>
  );
};

LiveRegion.propTypes = {
  /** Message to announce to screen readers */
  message: PropTypes.string,

  /**
   * Politeness level for announcements
   * - 'polite': Wait for pause in screen reader
   * - 'assertive': Interrupt screen reader immediately
   * - 'off': Do not announce
   */
  politeness: PropTypes.oneOf(['polite', 'assertive', 'off']),

  /**
   * Whether to announce the entire region or just changes
   * - true: Announce entire content
   * - false: Announce only changes
   */
  atomic: PropTypes.bool,

  /**
   * What changes to announce
   * - 'additions': New content
   * - 'removals': Removed content
   * - 'text': Text changes
   * - 'all': All changes
   */
  relevant: PropTypes.string,

  /**
   * Auto-clear message after milliseconds (0 = no auto-clear)
   */
  clearAfter: PropTypes.number,

  /**
   * ARIA role for the live region
   * - 'status': For status updates (default)
   * - 'alert': For important messages
   * - 'log': For log/history messages
   */
  role: PropTypes.oneOf(['status', 'alert', 'log']),

  /** Additional CSS class name */
  className: PropTypes.string,
};

/**
 * LiveRegion.Alert - Assertive announcements for important messages
 */
LiveRegion.Alert = ({ message, clearAfter = 5000, className = '' }) => (
  <LiveRegion
    message={message}
    politeness="assertive"
    role="alert"
    clearAfter={clearAfter}
    className={className}
  />
);

LiveRegion.Alert.propTypes = {
  message: PropTypes.string,
  clearAfter: PropTypes.number,
  className: PropTypes.string,
};

/**
 * LiveRegion.Status - Polite announcements for status updates
 */
LiveRegion.Status = ({ message, clearAfter = 5000, className = '' }) => (
  <LiveRegion
    message={message}
    politeness="polite"
    role="status"
    clearAfter={clearAfter}
    className={className}
  />
);

LiveRegion.Status.propTypes = {
  message: PropTypes.string,
  clearAfter: PropTypes.number,
  className: PropTypes.string,
};

/**
 * LiveRegion.Log - For log/history messages
 */
LiveRegion.Log = ({ message, className = '' }) => (
  <LiveRegion
    message={message}
    politeness="polite"
    role="log"
    clearAfter={0}
    className={className}
  />
);

LiveRegion.Log.propTypes = {
  message: PropTypes.string,
  className: PropTypes.string,
};

export default LiveRegion;
