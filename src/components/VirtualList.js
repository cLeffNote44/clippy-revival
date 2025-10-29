/**
 * Virtual scrolling list component for efficient rendering of large lists
 * Only renders visible items to improve performance
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

const VirtualList = React.memo(({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  onScroll = null
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate visible range
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);

  // Add overscan
  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length, visibleEnd + overscan);

  const visibleItems = items.slice(startIndex, endIndex);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for positioning visible items
  const offsetY = startIndex * itemHeight;

  // Handle scroll with requestAnimationFrame for performance
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;

    requestAnimationFrame(() => {
      setScrollTop(newScrollTop);

      if (onScroll) {
        onScroll({
          scrollTop: newScrollTop,
          scrollHeight: totalHeight,
          clientHeight: containerHeight
        });
      }
    });
  }, [onScroll, totalHeight, containerHeight]);

  return (
    <Box
      ref={containerRef}
      sx={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <Box
        sx={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <Box
                key={actualIndex}
                sx={{
                  height: itemHeight,
                  overflow: 'hidden'
                }}
              >
                {renderItem(item, actualIndex)}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
});

VirtualList.propTypes = {
  items: PropTypes.array.isRequired,
  itemHeight: PropTypes.number.isRequired,
  containerHeight: PropTypes.number.isRequired,
  renderItem: PropTypes.func.isRequired,
  overscan: PropTypes.number,
  onScroll: PropTypes.func
};

VirtualList.defaultProps = {
  overscan: 3,
  onScroll: null
};

VirtualList.displayName = 'VirtualList';

export default VirtualList;
