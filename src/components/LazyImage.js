/**
 * Lazy loading image component with performance optimizations
 * Images only load when they become visible in the viewport
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Box, CircularProgress } from '@mui/material';
import { useLazyImage } from '../hooks/usePerformance';

const LazyImage = React.memo(({
  src,
  alt,
  placeholder,
  width,
  height,
  objectFit = 'cover',
  borderRadius = 0,
  onLoad = null,
  onError = null,
  showLoader = true,
  loaderSize = 40
}) => {
  const { ref, src: currentSrc, loaded, error } = useLazyImage(src, placeholder);

  React.useEffect(() => {
    if (loaded && onLoad) {
      onLoad();
    }
    if (error && onError) {
      onError(error);
    }
  }, [loaded, error, onLoad, onError]);

  return (
    <Box
      ref={ref}
      sx={{
        position: 'relative',
        width: width || '100%',
        height: height || '100%',
        borderRadius,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0'
      }}
    >
      {!loaded && !error && showLoader && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <CircularProgress size={loaderSize} />
        </Box>
      )}

      {error && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: '#999',
            fontSize: '0.875rem'
          }}
        >
          Failed to load image
        </Box>
      )}

      <img
        src={currentSrc}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          display: loaded ? 'block' : 'none'
        }}
      />
    </Box>
  );
});

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  objectFit: PropTypes.oneOf(['cover', 'contain', 'fill', 'none', 'scale-down']),
  borderRadius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  showLoader: PropTypes.bool,
  loaderSize: PropTypes.number
};

LazyImage.defaultProps = {
  placeholder: null,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 0,
  onLoad: null,
  onError: null,
  showLoader: true,
  loaderSize: 40
};

LazyImage.displayName = 'LazyImage';

export default LazyImage;
